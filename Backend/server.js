require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
// MODIFICADO: 'better-sqlite3' removido
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- CONFIGURAÇÃO ---
const app = express();
const PORT = process.env.PORT || 3000;
// MODIFICADO: Use a variável de ambiente para o JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;
const upload = multer({ storage: multer.memoryStorage() });

// --- MIDDLEWARE ---
// MODIFICADO: Configuração de CORS para aceitar produção E localhost
const whiteList = [
  'https://flexgrupo.com.br', // Teu site em produção
  'http://localhost:55805',
  'http://192.168.1.15:55805'    // O teu servidor 'serve' (MUDA A PORTA SE FOR DIFERENTE)
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite pedidos sem 'origin' (como o Postman) ou da whitelist
    if (whiteList.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS'));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// MODIFICADO: Linha removida, o frontend agora está na HostGator
// app.use(express.static('../frontend'));

// --- BANCO DE DADOS ---
// MODIFICADO: Importa o novo database.js
const db = require('./database');
// MODIFICADO: Inicializa o banco de dados (cria tabelas se não existirem)
db.initDb().catch(err => {
  console.error("Falha ao inicializar o DB na inicialização do servidor:", err);
  process.exit(1);
});

// --- MÓDULOS INTERNOS ---
// MODIFICADO: 'database' já está importado acima
const { extrairTextoBruto, extrairCamposComLLM } = require('./Extraidados');

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
function verificarToken(req, res, next) {
    // Verificação de JWT_SECRET
    if (!JWT_SECRET) {
      console.error("JWT_SECRET não está definido nas variáveis de ambiente!");
      return res.status(500).json({ success: false, message: 'Erro interno do servidor: Chave de segurança não configurada.' });
    }
  
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

// MODIFICADO: Rota agora é ASYNC e usa a função do DB
app.post('/api/usuarios/registrar', async (req, res) => {
    try {
        const { nome, email, senha, cargo } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios.' });
        }

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(senha, salt);

        const novoUsuario = await db.registrarUsuario(nome, email, hash, cargo);

        res.status(201).json({ success: true, message: 'Usuário registrado com sucesso!', id: novoUsuario.id });

    } catch (error) {
        if (error.code === '23505') { // Código de violação única do PostgreSQL
            return res.status(409).json({ success: false, message: 'Este e-mail já está em uso.' });
        }
        console.error('💥 Erro ao registrar usuário:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// MODIFICADO: Rota agora é ASYNC e usa a função do DB
app.post('/api/usuarios/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' });
        }
        
        // Verificação de JWT_SECRET
        if (!JWT_SECRET) {
          console.error("JWT_SECRET não está definido!");
          return res.status(500).json({ success: false, message: 'Erro interno: Chave de segurança não configurada.' });
        }

        const usuario = await db.buscarUsuarioPorEmail(email);

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

// MODIFICADO: Adicionamos 'verificarToken' para proteger a rota
app.post('/api/upload-pdf', verificarToken, upload.single('pdfFile'), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY não está definida!");
      return res.status(500).json({ success: false, message: 'Erro interno: Chave da IA não configurada.' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'Nenhum PDF enviado' });
    
    const textoBruto = await extrairTextoBruto(req.file.buffer);
    const dados = await extrairCamposComLLM(textoBruto);
    res.json({ success: true, data: dados });
  } catch (error) {
    console.error('Erro no upload PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// MODIFICADO: Rota agora é ASYNC e protegida por token
app.post('/api/propostas', verificarToken, async (req, res) => {
  try {
    const proposta = req.body;
    // MODIFICADO: 'classe' adicionada como obrigatória
    const required = ['nome', 'cpfCnpj', 'endereco', 'numeroInstalacao', 'contato', 'tipoTensao', 'tipoPadrao', 'geracaoPropria','classe'];
    const missing = required.filter(field => !proposta[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: `Campos obrigatórios faltando: ${missing.join(', ')}` });
    }

    const result = await db.inserirProposta(proposta);

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

// MODIFICADO: Rota agora é ASYNC e protegida por token
app.get('/api/propostas', verificarToken, async (req, res) => {
  try {
    const result = await db.listarPropostas();
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Erro ao listar propostas:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar propostas' });
  }
});

// MODIFICADO: Rota agora é ASYNC e protegida por token
app.get('/api/propostas/instalacao/:numeroInstalacao', verificarToken, async (req, res) => {
  try {
    const { numeroInstalacao } = req.params;
    const proposta = await db.buscarPropostaPorInstalacao(numeroInstalacao);
    if (proposta) {
      res.json({ success: true, data: proposta });
    } else {
      res.status(404).json({ success: false, message: 'Instalação não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar instalação' });
  }
});

// MODIFICADO: Rota agora é ASYNC e protegida por token
app.get('/api/estatisticas', verificarToken, async (req, res) => {
  try {
    const estatisticas = await db.getEstatisticas();
    res.json({ success: true, data: estatisticas });
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    res.status(500).json({ success: false, message: 'Erro ao calcular estatísticas' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const { totalPropostas, totalUsuarios } = await db.getHealthCheckData();
    res.json({
      status: 'OK',
      message: 'Servidor com PostgreSQL funcionando!',
      database: { totalPropostas, totalUsuarios },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: 'Erro ao conectar com o banco', error: error.message });
  }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
// MODIFICADO: Process 'SIGINT' removido, o 'pg.Pool' gerencia conexões.
app.listen(PORT, () => {
  console.log(`SERVIDOR INICIADO na porta ${PORT}`);
});