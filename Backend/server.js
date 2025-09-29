const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3'); // ← better-sqlite3, não sqlite3
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('../frontend'));

// Configuração do Banco de Dados com Better-SQLite3
const dbPath = path.resolve(__dirname, 'propostas.db');
const db = new Database(dbPath);

// Criar tabela (sintaxe do better-sqlite3)
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
    valor_kwh REAL DEFAULT 1.19,
    economia_media REAL DEFAULT 0,
    economia_anual REAL DEFAULT 0,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Tabela propostas criada/verificada com better-sqlite3');


const database = require('./database');

// Na rota POST /api/propostas, use:


// Rotas da API
app.post('/api/propostas', (req, res) => {
  try {
    const proposta = req.body;
    
    console.log('📥 Recebendo proposta:', {
      nome: proposta.nome,
      cpfCnpj: proposta.cpfCnpj,
      tipoConsumo: proposta.tipoConsumo,
      tipoTensao: proposta.tipoTensao
    });

    // Validação
    const required = ['nome', 'cpfCnpj', 'endereco', 'numeroInstalacao', 'contato', 'tipoTensao', 'tipoPadrao', 'geracaoPropria'];
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

// Rota para listar propostas (atualizada para better-sqlite3)
app.get('/api/propostas', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM propostas ORDER BY data_criacao DESC');
    const rows = stmt.all();
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  } catch (error) {
    console.error('Erro ao buscar propostas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar propostas'
    });
  }
});

// Rota para estatísticas (atualizada para better-sqlite3)
app.get('/api/estatisticas', (req, res) => {
  try {
    // Total de propostas
    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM propostas');
    const totalRow = totalStmt.get();

    // Por tipo de padrão
    const tipoStmt = db.prepare('SELECT tipo_padrao, COUNT(*) as count FROM propostas GROUP BY tipo_padrao');
    const tipoRows = tipoStmt.all();

    // Por geração própria
    const geracaoStmt = db.prepare('SELECT geracao_propria, COUNT(*) as count FROM propostas GROUP BY geracao_propria');
    const geracaoRows = geracaoStmt.all();

    // Por tipo de tensão
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

// Rota de saúde do servidor
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

// Fechar conexão ao encerrar
process.on('SIGINT', () => {
  db.close();
  console.log('🔚 Conexão com o banco fechada.');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log('🚀 SERVIDOR COM BETTER-SQLITE3');
  console.log(`📊 Porta: ${PORT}`);
  console.log(`💾 Banco: ${dbPath}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
  console.log(`📈 Estatísticas: http://localhost:${PORT}/api/estatisticas`);
});