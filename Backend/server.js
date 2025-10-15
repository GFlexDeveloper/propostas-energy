const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- CONFIGURAÇÃO ---
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'mBRt5hJzqXyCk7L2wY3p6sZgT9Nv8EoDfGxQ1jrdUViFbAcHPuSaWn0lM4eOIKtRxZqYPv3JhNs2mT7kG5cLbB8w9f0DuXai1oERyW4tSFp6kMzVH7nC8LrBQxZd2D3WfNjUP0vlgTsGm5hAecY9uKIOJq'; // Chave secreta para os tokens
const upload = multer({ storage: multer.memoryStorage() });

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('../frontend'));

// --- BANCO DE DADOS ---
const dbPath = path.resolve(__dirname, 'propostas.db');
const db = new Database(dbPath);

// Criação da tabela de propostas
db.exec(`
  CREATE TABLE IF NOT EXISTS propostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf_cnpj TEXT NOT NULL,
    endereco TEXT NOT NULL,
    numero_instalacao TEXT NOT NULL,
    contato TEXT NOT NULL,
    email TEXT,
    tipo_consumo TEXT NOT NULL,
    janeiro REAL, fevereiro REAL, marco REAL, abril REAL, maio REAL, junho REAL,
    julho REAL, agosto REAL, setembro REAL, outubro REAL, novembro REAL, dezembro REAL,
    media_consumo REAL,
    tipo_padrao TEXT NOT NULL,
    geracao_propria TEXT NOT NULL,
    media_injecao REAL,
    desconto REAL DEFAULT 0,
    tipo_tensao TEXT NOT NULL,
    classe TEXT NOT NULL,
    valor_kwh REAL DEFAULT 1.19,
    economia_media REAL DEFAULT 0,
    economia_anual REAL DEFAULT 0,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Criação da tabela de usuários
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    cargo TEXT,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Tabelas propostas e usuarios criadas/verificadas.');

// --- MÓDULOS INTERNOS ---
const database = require('./database');
const { extrairTextoBruto, extrairCamposComLLM } = require('./Extraidados');

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Acesso negado. Nenhum token fornecido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token inválido ou expirado.' });
        }
        req.usuario = decoded;
        next();
    });
}


// --- ROTAS DE AUTENTICAÇÃO (PÚBLICAS) ---

// Rota de Registro de Usuário
app.post('/api/usuarios/registrar', (req, res) => {
    try {
        const { nome, email, senha, cargo } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios.' });
        }

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(senha, salt);

        const stmt = db.prepare('INSERT INTO usuarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)');
        const result = stmt.run(nome, email, hash, cargo || 'Vendedor');

        res.status(201).json({ success: true, message: 'Usuário registrado com sucesso!', id: result.lastInsertRowid });

    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ success: false, message: 'Este e-mail já está em uso.' });
        }
        console.error('💥 Erro ao registrar usuário:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// Rota de Login
app.post('/api/usuarios/login', (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' });
        }

        const stmt = db.prepare('SELECT * FROM usuarios WHERE email = ?');
        const usuario = stmt.get(email);

        if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
            return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
        }

        const token = jwt.sign({ id: usuario.id, email: usuario.email, nome: usuario.nome }, JWT_SECRET, {
            expiresIn: '8h'
        });

        res.json({ success: true, message: 'Login bem-sucedido!', token: token });
    } catch (error) {
        console.error('💥 Erro no login:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.'});
    }
});


// --- ROTAS DA APLICAÇÃO (PROTEGIDAS) ---

app.post('/api/upload-pdf', verificarToken, upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Nenhum PDF enviado' });
    const textoBruto = await extrairTextoBruto(req.file.buffer);
    const dados = await extrairCamposComLLM(textoBruto);
    res.json({ success: true, data: dados });
  } catch (error) {
    console.error('Erro no upload PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/propostas', verificarToken, (req, res) => {
  try {
    const proposta = req.body;
    const required = ['nome', 'cpfCnpj', 'endereco', 'numeroInstalacao', 'contato', 'tipoTensao', 'tipoPadrao', 'geracaoPropria','classe'];
    const missing = required.filter(field => !proposta[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: `Campos obrigatórios faltando: ${missing.join(', ')}` });
    }

    const result = database.inserirProposta(proposta);

    if (result.success) {
      console.log('✅ Proposta salva com ID:', result.id);
      res.status(201).json({ success: true, message: 'Proposta salva com sucesso!', id: result.id });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('💥 Erro na rota /api/propostas:', error);
    res.status(500).json({ success: false, message: 'Erro ao salvar proposta: ' + error.message });
  }
});

app.get('/api/propostas', verificarToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM propostas ORDER BY data_criacao DESC');
    res.json({ success: true, data: stmt.all() });
  } catch (error) {
    console.error('Erro ao listar propostas:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar propostas' });
  }
});

app.get('/api/propostas/instalacao/:numeroInstalacao', verificarToken, (req, res) => {
  try {
    const { numeroInstalacao } = req.params;
    const stmt = db.prepare('SELECT * FROM propostas WHERE numero_instalacao = ?');
    const proposta = stmt.get(numeroInstalacao);
    if (proposta) {
      res.json({ success: true, data: proposta });
    } else {
      res.status(404).json({ success: false, message: 'Instalação não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar instalação' });
  }
});

app.get('/api/estatisticas', verificarToken, (req, res) => {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as total FROM propostas').get();
    const tipoRows = db.prepare('SELECT tipo_padrao, COUNT(*) as count FROM propostas GROUP BY tipo_padrao').all();
    const geracaoRows = db.prepare('SELECT geracao_propria, COUNT(*) as count FROM propostas GROUP BY geracao_propria').all();
    const tensaoRows = db.prepare('SELECT tipo_tensao, COUNT(*) as count FROM propostas GROUP BY tipo_tensao').all();

    const estatisticas = {
      totalPropostas: totalRow.total,
      porTipoPadrao: tipoRows.reduce((acc, row) => ({...acc, [row.tipo_padrao]: row.count}), {}),
      porGeracaoPropria: geracaoRows.reduce((acc, row) => ({...acc, [row.geracao_propria]: row.count}), {}),
      porTipoTensao: tensaoRows.reduce((acc, row) => ({...acc, [row.tipo_tensao]: row.count}), {})
    };
    res.json({ success: true, data: estatisticas });
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    res.status(500).json({ success: false, message: 'Erro ao calcular estatísticas' });
  }
});

app.get('/api/health', (req, res) => {
  try {
    const totalPropostas = db.prepare('SELECT COUNT(*) as total FROM propostas').get().total;
    const totalUsuarios = db.prepare('SELECT COUNT(*) as total FROM usuarios').get().total;
    res.json({
      status: 'OK',
      message: 'Servidor com Better-SQLite3 funcionando!',
      database: { totalPropostas, totalUsuarios, arquivo: dbPath },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: 'Erro ao conectar com o banco', error: error.message });
  }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
process.on('SIGINT', () => {
  db.close();
  console.log('🔚 Conexão com o banco fechada.');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 SERVIDOR INICIADO na porta ${PORT}`);
});