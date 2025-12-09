require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // Importante para o WhatsApp

// --- BANCO DE DADOS ---
const db = require('./database'); // Certifique-se que database.js está na mesma pasta ou ajuste o caminho

// --- CONFIGURAÇÃO ---
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const upload = multer({ storage: multer.memoryStorage() });

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// IMPORTANTE: Serve os arquivos estáticos da pasta Frontend (irmã da pasta Backend)
app.use(express.static(path.join(__dirname, '../Frontend')));

// Inicializa o banco de dados
db.initDb().catch(err => {
  console.error("Falha ao inicializar o DB:", err);
});

// Importação opcional do extrator (se estiver usando IA)
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
    if (!req.file) return res.status(400).json({ success: false, message: 'Nenhum PDF.' });
    const textoBruto = await extrairTextoBruto(req.file.buffer);
    const dados = await extrairCamposComLLM(textoBruto);
    res.json({ success: true, data: dados });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/propostas', verificarToken, async (req, res) => {
  try {
    const proposta = req.body;
    const usuarioId = req.usuario.id; // ID do usuário logado

    const result = await db.inserirProposta(proposta, usuarioId);

    if (result.success) {
      res.status(201).json({ success: true, message: 'Salvo!', id: result.id });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
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
    res.status(500).json({ success: false, message: 'Erro ao listar.' });
  }
});

app.get('/api/propostas/instalacao/:numeroInstalacao', verificarToken, async (req, res) => {
  try {
    const { numeroInstalacao } = req.params;
    const proposta = await db.buscarPropostaPorInstalacao(numeroInstalacao);
    if (proposta) {
      res.json({ success: true, data: proposta });
    } else {
      res.status(404).json({ success: false, message: 'Não encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar.' });
  }
});

// --- ROTA DE WHATSAPP (UAZAPI) ---
a// --- ROTA DE WHATSAPP (UAZAPI) ---
app.post('/api/enviar-whatsapp', verificarToken, upload.single('pdfFile'), async (req, res) => {
    try {
        const { phone, message, fileName } = req.body;

        if (!req.file || !phone) {
            return res.status(400).json({ success: false, message: 'Faltam dados.' });
        }

        // Converte o PDF recebido (buffer) em base64
        const base64File = req.file.buffer.toString('base64');

        // Se a Uazapi aceitar base64, normalmente funciona bem assim:
        const fileAsDataUrl = `data:application/pdf;base64,${base64File}`;

        const UAZAPI_URL = 'https://flexgrupo.uazapi.com/send/media';

        const options = {
            method: 'POST',
            url: UAZAPI_URL,
            headers: {
                Accept: 'application/json',
                token: process.env.UAZAPI_TOKEN,      // 🔒 vem do .env
                'Content-Type': 'application/json'
            },
            data: {
                number: phone,                        // ex: 5537999999999
                type: 'document',                     // conforme doc
                file: fileAsDataUrl,                  // AQUI: PDF em base64
                docName: fileName || 'Proposta.pdf',  // nome exibido no Whats
                text: message || 'Segue sua proposta oficial da Flex Energy.'
            }
        };

        const { data } = await axios.request(options);
        return res.json({ success: true, data });

    } catch (error) {
        console.error('Erro Zap:', error.response?.data || error.message);
        return res.status(500).json({ success: false, message: 'Erro no envio.' });
    }
});

// Rota coringa para SPA (Single Page Application) - Redireciona tudo para o index do Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📂 Servindo Frontend de: ${path.join(__dirname, '../Frontend')}`);
});