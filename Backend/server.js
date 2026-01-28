require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const db = require('./database');
const { executarFluxoIntegracao } = require('./integracao-flow');

const app = express();
const PORT = process.env.PORT || 6969;
const JWT_SECRET = process.env.JWT_SECRET;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../Frontend')));

db.initDb().catch(err => console.error("❌ Falha ao inicializar o banco RDS:", err));

const { extrairTextoBruto, extrairCamposComLLM } = require('./Extraidados');

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Acesso negado.' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: 'Token inválido.' });
        req.usuario = decoded;
        next();
    });
}

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/usuarios/registrar', async (req, res) => {
    try {
        const { nome, email, senha, cargo } = req.body;
        if (!nome || !email || !senha) return res.status(400).json({ success: false, message: 'Dados incompletos.' });
        const hash = bcrypt.hashSync(senha, 10);
        const novoUsuario = await db.registrarUsuario(nome, email, hash, cargo);
        res.status(201).json({ success: true, id: novoUsuario.id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao registrar.' });
    }
});

app.post('/api/usuarios/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await db.buscarUsuarioPorEmail(email);
        if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
            return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
        }
        const token = jwt.sign({ id: usuario.id, email: usuario.email, nome: usuario.nome, cargo: usuario.cargo }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro no login.' });
    }
});

// --- ROTA DE UPLOAD PDF ---
app.post('/api/upload-pdf', verificarToken, upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Nenhum PDF enviado.' });
    const textoBruto = await extrairTextoBruto(req.file.buffer);
    const dados = await extrairCamposComLLM(textoBruto);
    res.json({ success: true, data: dados });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ROTA PRINCIPAL: SALVAR PROPOSTA E INTEGRAR SALESFORCE ---
app.post('/api/propostas', verificarToken, async (req, res) => {
  try {
    const propostaOriginal = req.body;
    const usuarioId = req.usuario.id;

    // 1. Limpeza para o Banco de Dados (Remove campos de cálculo do front que não estão na tabela)
    const propostaParaBanco = { ...propostaOriginal };
    const camposExtras = ['economiaMedia', 'economiaAnual', 'valorPagoFlexMedia', 'valorPagoFlexAnual', 'valorPagoCemigMedia', 'valorPagoCemigAnual'];
    camposExtras.forEach(campo => delete propostaParaBanco[campo]);

    // Salva no RDS e obtém a faixa de consumo calculada
    const result = await db.inserirProposta(propostaParaBanco, usuarioId);
    if (!result.success) throw new Error(result.error);

    // 2. Preparação para Salesforce
    console.log("⚡ [Server] Disparando integração com Salesforce...");
    const dadosParaSalesforce = {
        nomeConta: propostaOriginal.razaoSocial || propostaOriginal.nome, 
        cnpj: propostaOriginal.cnpj, 
        cpf: propostaOriginal.cpf,   
        email: propostaOriginal.email,
        telefone: propostaOriginal.telefone || propostaOriginal.contato,
        celular: propostaOriginal.celular || propostaOriginal.whatsapp,
        representante: req.usuario.nome || "", 
        ruaCobranca: propostaOriginal.logradouro,
        cidadeCobranca: propostaOriginal.cidade,
        estadoCobranca: propostaOriginal.uf, 
        cepCobranca: propostaOriginal.cep,
        numeroInstalacao: propostaOriginal.uc || propostaOriginal.numeroInstalacao,
        concessionaria: propostaOriginal.concessionaria || "Cemig",
        loginConcessionaria: propostaOriginal.login,
        senhaConcessionaria: propostaOriginal.senha,
        categoriaConta: propostaOriginal.categoria || "Pessoa Jurídica", 
        tipoContaLuz: propostaOriginal.tipoTensao || "Baixa Tensao",     
        faseContaLuz: propostaOriginal.fase || "Trifásico",              
        consumo: propostaOriginal.mediaConsumo || 0, 
        valorKwh: propostaOriginal.tarifa || 1.15,                      
        desconto: propostaOriginal.desconto || 0,                       
        tempoContrato: propostaOriginal.prazo || "120 Meses",
        empresaProprietaria: "Flex Energy", 
        origem: "App vendedores externos",
        faixaConsumo: result.faixaCalculada, // Usa a faixa calculada no banco
        temperatura: "Quente"
    };

    executarFluxoIntegracao(dadosParaSalesforce)
        .then(resInteg => console.log(resInteg.success ? `✅ [Salesforce] Criada OS: ${resInteg.serviceOrderId}` : `❌ [Salesforce] Falha: ${resInteg.error}`))
        .catch(err => console.error("❌ [Salesforce] Erro Crítico:", err));

    res.status(201).json({ success: true, message: 'Proposta salva!', id: result.id });

  } catch (error) {
    console.error("❌ Erro ao processar proposta:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/propostas', verificarToken, async (req, res) => {
  try {
    const { id, cargo } = req.usuario;
    const isAdmin = cargo === 'Admin' || cargo === 'Administrador';
    const result = await db.listarPropostas(id, isAdmin);
    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar propostas.' });
  }
});

app.post('/api/enviar-whatsapp', verificarToken, upload.single('pdfFile'), async (req, res) => {
    try {
        const { phone, message, fileName } = req.body;
        const base64File = req.file.buffer.toString('base64');
        const fileAsDataUrl = `data:application/pdf;base64,${base64File}`;
        const { data } = await axios.post('https://flexgrupo.uazapi.com/send/media', {
            number: phone, type: 'document', file: fileAsDataUrl, docName: fileName || 'Proposta_Flex.pdf', text: message || 'Olá, segue proposta.'
        }, { headers: { token: process.env.UAZAPI_TOKEN } });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro no envio do WhatsApp.' });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../Frontend', 'index.html')));

app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));