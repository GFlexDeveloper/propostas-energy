// database.js - Configuração do banco de dados com better-sqlite3
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'propostas.db');
const db = new Database(dbPath);

// Criar tabela se não existir
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
    desconto REAL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Função para inserir proposta
function inserirProposta(proposta) {
  try {
    const {
      nome,
      cpfCnpj,
      endereco,
      numeroInstalacao,
      contato,
      email,
      tipoConsumo,
      janeiro,
      fevereiro,
      marco,
      abril,
      maio,
      junho,
      julho,
      agosto,
      setembro,
      outubro,
      novembro,
      dezembro,
      mediaConsumo,
      tipoPadrao,
      geracaoPropria,
      mediaInjecao,
      desconto
    } = proposta;

    const sql = `
      INSERT INTO propostas (
        nome, cpf_cnpj, endereco, numero_instalacao, contato, email, tipo_consumo,
        janeiro, fevereiro, marco, abril, maio, junho, julho, agosto, setembro, outubro, novembro, dezembro,
        media_consumo, tipo_padrao, geracao_propria, media_injecao, desconto
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = db.prepare(sql);
    const result = stmt.run(
      nome, cpfCnpj, endereco, numeroInstalacao, contato, email || null, tipoConsumo,
      janeiro || null, fevereiro || null, marco || null, abril || null, 
      maio || null, junho || null, julho || null, agosto || null, 
      setembro || null, outubro || null, novembro || null, dezembro || null,
      mediaConsumo || null, tipoPadrao, geracaoPropria, mediaInjecao || null, desconto || 0
    );

    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error('Erro ao inserir proposta:', error);
    return { success: false, error: error.message };
  }
}

// Função para listar propostas (opcional)
function listarPropostas() {
  try {
    const stmt = db.prepare('SELECT * FROM propostas ORDER BY data_criacao DESC');
    return stmt.all();
  } catch (error) {
    console.error('Erro ao listar propostas:', error);
    return [];
  }
}

module.exports = {
  inserirProposta,
  listarPropostas
};