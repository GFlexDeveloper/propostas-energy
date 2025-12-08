require('dotenv').config();
const { Pool } = require('pg');

// Configuração para diferenciar Produção (Render) de Desenvolvimento (Local)
const isProduction = process.env.NODE_ENV === 'production';

// Configuração do Pool de conexões
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
};

// Se estiver em produção, adiciona a configuração de SSL exigida pelo Render
if (isProduction) {
  connectionConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(connectionConfig);

async function initDb() {
  const usuariosTable = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      cargo TEXT DEFAULT 'Vendedor',
      data_criacao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const propostasTable = `
    CREATE TABLE IF NOT EXISTS propostas (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id),
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
      valor_pago_flex_media REAL DEFAULT 0,
      valor_pago_flex_anual REAL DEFAULT 0,
      valor_pago_cemig_media REAL DEFAULT 0,
      valor_pago_cemig_anual REAL DEFAULT 0,
      data_criacao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(usuariosTable); // Cria usuários primeiro
    await pool.query(propostasTable);
    console.log('✅ Tabelas verificadas/criadas com sucesso no PostgreSQL.');
  } catch (error) {
    console.error('❌ Erro ao inicializar o banco de dados:', error);
    process.exit(1);
  }
}

async function inserirProposta(proposta, usuarioId) {
  const sql = `
    INSERT INTO propostas (
      usuario_id, nome, cpf_cnpj, endereco, numero_instalacao, contato, email, tipo_consumo,
      janeiro, fevereiro, marco, abril, maio, junho, julho, agosto, setembro, outubro, novembro, dezembro,
      media_consumo, tipo_padrao, geracao_propria, media_injecao, desconto,
      tipo_tensao, valor_kwh, economia_media, economia_anual,
      valor_pago_flex_media, valor_pago_flex_anual, valor_pago_cemig_media, valor_pago_cemig_anual, classe
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
    ) RETURNING id
  `;
  
  const values = [
    usuarioId,
    proposta.nome, proposta.cpfCnpj, proposta.endereco, proposta.numeroInstalacao, proposta.contato, proposta.email || null, proposta.tipoConsumo,
    proposta.janeiro || null, proposta.fevereiro || null, proposta.marco || null, proposta.abril || null, proposta.maio || null, proposta.junho || null,
    proposta.julho || null, proposta.agosto || null, proposta.setembro || null, proposta.outubro || null, proposta.novembro || null, proposta.dezembro || null,
    proposta.mediaConsumo || null, proposta.tipoPadrao, proposta.geracaoPropria, proposta.mediaInjecao || null, proposta.desconto || 0,
    proposta.tipoTensao, proposta.valorKwh || 1.19, proposta.economiaMedia || 0, proposta.economiaAnual || 0,
    proposta.valorPagoFlexMedia || 0, proposta.valorPagoFlexAnual || 0, proposta.valorPagoCemigMedia || 0, proposta.valorPagoCemigAnual || 0, proposta.classe
  ];

  try {
    const result = await pool.query(sql, values);
    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error('❌ Erro ao inserir proposta:', error);
    return { success: false, error: error.message };
  }
}

async function listarPropostas(usuarioId, isAdmin) {
  try {
    let query = 'SELECT * FROM propostas';
    let values = [];

    // Se NÃO for admin, filtra pelo ID do usuário
    if (!isAdmin) {
      query += ' WHERE usuario_id = $1';
      values.push(usuarioId);
    }

    query += ' ORDER BY data_criacao DESC';

    const result = await pool.query(query, values);
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Erro ao listar propostas:', error);
    return { success: false, error: error.message, data: [] };
  }
}

async function registrarUsuario(nome, email, hash, cargo) {
  const sql = 'INSERT INTO usuarios (nome, email, senha, cargo) VALUES ($1, $2, $3, $4) RETURNING id';
  const result = await pool.query(sql, [nome, email, hash, cargo || 'Vendedor']);
  return result.rows[0];
}

async function buscarUsuarioPorEmail(email) {
  const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
  return result.rows[0];
}

async function buscarPropostaPorInstalacao(numeroInstalacao) {
  const result = await pool.query('SELECT * FROM propostas WHERE numero_instalacao = $1', [numeroInstalacao]);
  return result.rows[0]; 
}

async function getEstatisticas() {
  const totalQuery = pool.query('SELECT COUNT(*) as total FROM propostas');
  const tipoQuery = pool.query('SELECT tipo_padrao, COUNT(*) as count FROM propostas GROUP BY tipo_padrao');
  
  const [totalRes, tipoRes] = await Promise.all([totalQuery, tipoQuery]);

  return {
    totalPropostas: totalRes.rows[0].total,
    porTipoPadrao: tipoRes.rows.reduce((acc, row) => ({...acc, [row.tipo_padrao]: row.count}), {})
  };
}

async function getHealthCheckData() {
  const totalPropostas = (await pool.query('SELECT COUNT(*) as total FROM propostas')).rows[0].total;
  return { totalPropostas };
}

module.exports = {
  initDb,
  inserirProposta,
  listarPropostas,
  registrarUsuario,
  buscarUsuarioPorEmail,
  buscarPropostaPorInstalacao,
  getEstatisticas,
  getHealthCheckData
};