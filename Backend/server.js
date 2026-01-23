require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// --- BANCO DE DADOS (Configurado para o novo RDS via .env) ---
const db = require('./database');

// --- INTEGRAÇÃO SALESFORCE ---
const { executarFluxoIntegracao } = require('./integracao-flow');

// --- CONFIGURAÇÃO ---
const app = express();
const PORT = process.env.PORT || 6969;
const JWT_SECRET = process.env.JWT_SECRET;
const upload = multer({ storage: multer.memoryStorage() });

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve os arquivos estáticos da pasta Frontend
app.use(express.static(path.join(__dirname, '../Frontend')));

// Inicializa o banco de dados e cria o schema/tabelas automaticamente no RDS
db.initDb().catch(err => {
  console.error("❌ Falha ao inicializar o banco de dados RDS:", err);
});

const { extrairTextoBruto, extrairCamposComLLM } = require('./Extraidados');

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Acesso negado.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token inválido.' });
        }
        req.usuario = decoded;
        next();
    });
}

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/usuarios/registrar', async (req, res) => {
    try {
        const { nome, email, senha, cargo } = req.body;
        if (!nome || !email || !senha) return res.status(400).json({ success: false, message: 'Dados incompletos.' });

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(senha, salt);
        const novoUsuario = await db.registrarUsuario(nome, email, hash, cargo);

        res.status(201).json({ success: true, message: 'Usuário registrado!', id: novoUsuario.id });
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

        const token = jwt.sign({ 
            id: usuario.id, 
            email: usuario.email, 
            nome: usuario.nome,
            cargo: usuario.cargo 
        }, JWT_SECRET, { expiresIn: '12h' });

        res.json({ success: true, message: 'Login OK!', token: token });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro no login.' });
    }
});

// --- ROTAS DA APLICAÇÃO ---

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

// =========================================================================
// 🚀 ROTA PRINCIPAL: SALVAR PROPOSTA E INTEGRAR COM SALESFORCE
// =========================================================================
app.post('/api/propostas', verificarToken, async (req, res) => {
  try {
    const proposta = req.body; // Dados vindos do formulário do Frontend
    const usuarioId = req.usuario.id;

    // 1. Salva no Banco de Dados RDS (PostgreSQL)
    const result = await db.inserirProposta(proposta, usuarioId);

    if (!result.success) {
      throw new Error(result.error);
    }

    // 2. Integração com Salesforce (Disparo automático em background)
    console.log("⚡ [Server] Disparando integração com Salesforce...");
    
    const dadosParaSalesforce = {
        // --- Identificação ---
        nomeConta: proposta.razaoSocial || proposta.nome, 
        cnpj: proposta.cnpj, 
        cpf: proposta.cpf,   
        email: proposta.email,
        telefone: proposta.telefone,
        celular: proposta.celular || proposta.whatsapp,
        representante: req.usuario.nome || "", 

        // --- Endereço ---
        ruaCobranca: proposta.logradouro,
        cidadeCobranca: proposta.cidade,
        estadoCobranca: proposta.uf, 
        cepCobranca: proposta.cep,
        paisCobranca: "Brasil",

        // --- Energia ---
        numeroInstalacao: proposta.uc,
        concessionaria: proposta.concessionaria || "Cemig",
        loginConcessionaria: proposta.login,
        senhaConcessionaria: proposta.senha,

        // --- Características Técnicas (Picklists) ---
        categoriaConta: proposta.categoria || "Pessoa Jurídica", 
        tipoContaLuz: proposta.tipoTensao || "Baixa Tensao",     
        faseContaLuz: proposta.fase || "Trifásico",              
        temInscricaoEstadual: proposta.temIE || "Não",

        // --- Financeiro ---
        consumo: proposta.mediaConsumo || proposta.consumo, 
        valorKwh: proposta.tarifa || 1.15,                      
        valorTarifa: proposta.tarifaComImposto || 0.95,         
        iluminacaoPublica: proposta.cip || 50.00,               
        desconto: proposta.desconto || 0,                       
        
        // --- Detalhes do Contrato ---
        tempoContrato: proposta.prazo || "120 Meses",
        empresaProprietaria: "Flex Energy", 
        origem: "App vendedores externos",
        
        // Campos de suporte ao script
        faixaConsumo: proposta.faixa || "2000 - 10000 kW",
        pontosConexao: 1,
        temperatura: "Quente"
    };

    // Executa sem dar 'await' para responder ao usuário mais rápido
    executarFluxoIntegracao(dadosParaSalesforce)
        .then(resInteg => {
            if(resInteg.success) {
                console.log(`✅ [Salesforce] Sucesso! OS Criada: ${resInteg.serviceOrderId}`);
            } else {
                console.error("❌ [Salesforce] Falha na integração:", resInteg.error);
            }
        })
        .catch(err => console.error("❌ [Salesforce] Erro Crítico:", err));

    // Resposta imediata para o Frontend
    res.status(201).json({ success: true, message: 'Proposta salva e integração iniciada!', id: result.id });

  } catch (error) {
    console.error("❌ Erro ao processar proposta:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/propostas', verificarToken, async (req, res) => {
  try {
    const { id, cargo } = req.usuario;
    const isAdmin = cargo === 'Admin' || cargo === 'Administrador';
    const result = await db.listarPropostas(id, isAdmin);
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar propostas.' });
  }
});

// --- ROTA DE WHATSAPP ---
app.post('/api/enviar-whatsapp', verificarToken, upload.single('pdfFile'), async (req, res) => {
    try {
        const { phone, message, fileName } = req.body;
        if (!req.file || !phone) return res.status(400).json({ success: false, message: 'Faltam dados para o envio.' });

        const base64File = req.file.buffer.toString('base64');
        const fileAsDataUrl = `data:application/pdf;base64,${base64File}`;
        const UAZAPI_URL = 'https://flexgrupo.uazapi.com/send/media';

        const { data } = await axios.post(UAZAPI_URL, {
            number: phone,
            type: 'document',
            file: fileAsDataUrl,
            docName: fileName || 'Proposta_Flex.pdf',
            text: message || 'Olá, segue sua proposta oficial da Flex Energy.'
        }, {
            headers: { token: process.env.UAZAPI_TOKEN }
        });

        return res.json({ success: true, data });
    } catch (error) {
        console.error('Erro Zap:', error.response?.data || error.message);
        return res.status(500).json({ success: false, message: 'Erro no envio do WhatsApp.' });
    }
});

// SPA Redirect
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📂 Servindo Frontend de: ${path.join(__dirname, '../Frontend')}`);
});