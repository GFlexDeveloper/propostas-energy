const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const path = require('path');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { analisarFaturaCemig } = require('./Extraidados');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('../frontend'));

const dbPath = path.resolve(__dirname, 'propostas.db');
const db = new Database(dbPath);

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
    janeiro REAL,
    fevereiro REAL,
    marco REAL,
    abril REAL,
    maio REAL,
    junho REAL,
    julho REAL,
    agosto REAL,
    setembro REAL,
    outubro REAL,
    novembro REAL,
    dezembro REAL,
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

console.log('✅ Tabela propostas criada/verificada com better-sqlite3');

const database = require('./database');

const { extrairTextoBruto, extrairCamposComLLM } = require('./Extraidados');

app.post('/api/upload-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Nenhum PDF enviado' });

    const pdfBuffer = req.file.buffer;
    const textoBruto = await extrairTextoBruto(pdfBuffer);
    const dadosExtraidos = await extrairCamposComLLM(textoBruto);

    res.json({ success: true, data: dadosExtraidos });
  } catch (error) {
    console.error('Erro no upload PDF:', error);
    res.status(500).json({ success: false, message: 'Erro ao processar PDF' });
  }
});



app.post('/api/propostas', (req, res) => {
  try {
    const proposta = req.body;
    
    console.log('📥 Recebendo proposta:', {
      nome: proposta.nome,
      cpfCnpj: proposta.cpfCnpj,
      tipoConsumo: proposta.tipoConsumo,
      tipoTensao: proposta.tipoTensao,
      classe: proposta.classe
    });

    const required = ['nome', 'cpfCnpj', 'endereco', 'numeroInstalacao', 'contato', 'tipoTensao', 'tipoPadrao', 'geracaoPropria','classe'];
    const missing = required.filter(field => !proposta[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios faltando: ${missing.join(', ')}`
      });
    }

    const result = database.inserirProposta(proposta);

    if (result.success) {
      console.log('✅ Proposta salva com ID:', result.id);
      res.json({
        success: true,
        message: 'Proposta salva com sucesso!',
        id: result.id
      });
    } else {
      console.error('❌ Erro ao salvar proposta:', result.error);
      res.status(500).json({
        success: false,
        message: 'Erro ao salvar proposta no banco de dados: ' + result.error
      });
    }

  } catch (error) {
    console.error('💥 Erro na rota /api/propostas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.get('/api/propostas', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM propostas ORDER BY data_criacao DESC');
    const propostas = stmt.all();
    res.json({
      success: true,
      data: propostas
    });
  } catch (error) {
    console.error('Erro ao listar propostas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar propostas'
    });
  }
});

app.get('/api/propostas/instalacao/:numeroInstalacao', (req, res) => {
  try {
    const { numeroInstalacao } = req.params;
    const stmt = db.prepare('SELECT * FROM propostas WHERE numero_instalacao = ?');
    const proposta = stmt.get(numeroInstalacao);

    if (proposta) {
      res.json({
        success: true,
        data: proposta
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Instalação não encontrada'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar instalação'
    });
  }
});

app.get('/api/estatisticas', (req, res) => {
  try {
    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM propostas');
    const totalRow = totalStmt.get();

    const tipoStmt = db.prepare('SELECT tipo_padrao, COUNT(*) as count FROM propostas GROUP BY tipo_padrao');
    const tipoRows = tipoStmt.all();

    const geracaoStmt = db.prepare('SELECT geracao_propria, COUNT(*) as count FROM propostas GROUP BY geracao_propria');
    const geracaoRows = geracaoStmt.all();

    const tensaoStmt = db.prepare('SELECT tipo_tensao, COUNT(*) as count FROM propostas GROUP BY tipo_tensao');
    const tensaoRows = tensaoStmt.all();

    const estatisticas = {
      totalPropostas: totalRow.total,
      porTipoPadrao: {},
      porGeracaoPropria: {},
      porTipoTensao: {}
    };

    tipoRows.forEach(row => {
      estatisticas.porTipoPadrao[row.tipo_padrao] = row.count;
    });

    geracaoRows.forEach(row => {
      estatisticas.porGeracaoPropria[row.geracao_propria] = row.count;
    });

    tensaoRows.forEach(row => {
      estatisticas.porTipoTensao[row.tipo_tensao] = row.count;
    });

    res.json({
      success: true,
      data: estatisticas
    });
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular estatísticas'
    });
  }
});

app.get('/api/health', (req, res) => {
  try {
    const stmt = db.prepare('SELECT COUNT(*) as total FROM propostas');
    const row = stmt.get();
    
    res.json({
      status: 'OK',
      message: 'Servidor com Better-SQLite3 funcionando!',
      database: {
        totalPropostas: row.total,
        arquivo: dbPath,
        driver: 'better-sqlite3'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'ERROR',
      message: 'Erro ao conectar com o banco',
      error: error.message
    });
  }
});

process.on('SIGINT', () => {
  db.close();
  console.log('🔚 Conexão com o banco fechada.');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log('SERVIDOR INICIADO');
});