const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('../frontend'));

// Configuração do Banco de Dados com better-sqlite3
const dbPath = path.resolve(__dirname, 'propostas.db');
const db = new Database(dbPath);

// Criar tabela
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
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Tabela propostas criada/verificada com better-sqlite3');

// Preparar statements SQL (melhor performance)
const insertProposta = db.prepare(`
  INSERT INTO propostas (
    nome, cpf_cnpj, endereco, numero_instalacao, contato, email, tipo_consumo,
    janeiro, fevereiro, marco, abril, maio, junho, julho, agosto, setembro, outubro, novembro, dezembro,
    media_consumo, tipo_padrao, geracao_propria, media_injecao, desconto
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const selectAllPropostas = db.prepare('SELECT * FROM propostas ORDER BY data_criacao DESC');
const selectPropostasCount = db.prepare('SELECT COUNT(*) as total FROM propostas');
const selectPorTipo = db.prepare('SELECT tipo_padrao, COUNT(*) as count FROM propostas GROUP BY tipo_padrao');
const selectPorGeracao = db.prepare('SELECT geracao_propria, COUNT(*) as count FROM propostas GROUP BY geracao_propria');

// Função para inserir proposta (síncrona com better-sqlite3)
function inserirProposta(proposta) {
  const params = [
    proposta.nome,
    proposta.cpfCnpj,
    proposta.endereco,
    proposta.numeroInstalacao,
    proposta.contato,
    proposta.email || null,
    proposta.tipoConsumo,
    proposta.janeiro || null,
    proposta.fevereiro || null,
    proposta.marco || null,
    proposta.abril || null,
    proposta.maio || null,
    proposta.junho || null,
    proposta.julho || null,
    proposta.agosto || null,
    proposta.setembro || null,
    proposta.outubro || null,
    proposta.novembro || null,
    proposta.dezembro || null,
    proposta.mediaConsumo || null,
    proposta.tipoPadrao,
    proposta.geracaoPropria,
    proposta.mediaInjecao || null,
    proposta.desconto || 0
  ];

  const result = insertProposta.run(params);
  return result.lastInsertRowid;
}

// Rotas da API
app.post('/api/propostas', (req, res) => {
  try {
    const proposta = req.body;
    
    console.log('📥 Recebendo proposta:', {
      nome: proposta.nome,
      cpfCnpj: proposta.cpfCnpj,
      tipoConsumo: proposta.tipoConsumo
    });

    // Validação
    const required = ['nome', 'cpfCnpj', 'endereco', 'numeroInstalacao', 'contato', 'tipoPadrao', 'geracaoPropria'];
    const missing = required.filter(field => !proposta[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios faltando: ${missing.join(', ')}`
      });
    }

    try {
      const id = inserirProposta(proposta);
      console.log('✅ Proposta salva com ID:', id);
      
      res.json({
        success: true,
        message: 'Proposta salva com sucesso!',
        id: id
      });
    } catch (dbError) {
      console.error('❌ Erro ao salvar no banco:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar proposta no banco de dados'
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
    const rows = selectAllPropostas.all();
    
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

app.get('/api/estatisticas', (req, res) => {
  try {
    const totalRow = selectPropostasCount.get();
    const tipoRows = selectPorTipo.all();
    const geracaoRows = selectPorGeracao.all();

    const estatisticas = {
      totalPropostas: totalRow.total,
      porTipoPadrao: {},
      porGeracaoPropria: {}
    };

    tipoRows.forEach(row => {
      estatisticas.porTipoPadrao[row.tipo_padrao] = row.count;
    });

    geracaoRows.forEach(row => {
      estatisticas.porGeracaoPropria[row.geracao_propria] = row.count;
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
    const row = selectPropostasCount.get();
    
    res.json({
      status: 'OK',
      message: 'Servidor com Better-SQLite3 funcionando!',
      database: {
        totalPropostas: row ? row.total : 0,
        arquivo: dbPath,
        status: 'Conectado',
        driver: 'better-sqlite3'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'ERROR',
      message: 'Erro na conexão com o banco',
      error: error.message
    });
  }
});

// Fechar conexão ao encerrar
process.on('SIGINT', () => {
  try {
    db.close();
    console.log('🔚 Conexão com o banco fechada.');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao fechar banco:', err);
    process.exit(1);
  }
});

app.listen(PORT, () => {
  console.log('🚀 SERVIDOR COM BETTER-SQLITE3');
  console.log(`📊 Porta: ${PORT}`);
  console.log(`💾 Banco: ${dbPath}`);
  console.log(`⚡ Driver: better-sqlite3 (mais rápido!)`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
  console.log(`📈 Estatísticas: http://localhost:${PORT}/api/estatisticas`);
});