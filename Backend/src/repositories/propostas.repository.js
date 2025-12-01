<<<<<<< HEAD
const { getPool } = require('../config/database');

async function inserir(proposta) {
  const pool = getPool();

  const query = `
    INSERT INTO propostas
      (nome, cpf_cnpj, endereco, numero_instalacao, contato, tipo_tensao, tipo_padrao, geracao_propria, classe)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const values = [
    proposta.nome,
    proposta.cpfCnpj,
    proposta.endereco,
    proposta.numeroInstalacao,
    proposta.contato,
    proposta.tipoTensao,
    proposta.tipoPadrao,
    proposta.geracaoPropria,
    proposta.classe
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function buscarTodas() {
  const pool = getPool();
  const { rows } = await pool.query('SELECT * FROM propostas ORDER BY id DESC');
  return rows;
}

async function buscarPorInstalacao(numeroInstalacao) {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM propostas WHERE numero_instalacao = $1',
    [numeroInstalacao]
  );
  return rows[0];
}

module.exports = {
  inserir,
  buscarTodas,
  buscarPorInstalacao
};
=======
const { getPool } = require('../config/database');

async function inserir(proposta) {
  const pool = getPool();

  const query = `
    INSERT INTO propostas
      (nome, cpf_cnpj, endereco, numero_instalacao, contato, tipo_tensao, tipo_padrao, geracao_propria, classe)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const values = [
    proposta.nome,
    proposta.cpfCnpj,
    proposta.endereco,
    proposta.numeroInstalacao,
    proposta.contato,
    proposta.tipoTensao,
    proposta.tipoPadrao,
    proposta.geracaoPropria,
    proposta.classe
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function buscarTodas() {
  const pool = getPool();
  const { rows } = await pool.query('SELECT * FROM propostas ORDER BY id DESC');
  return rows;
}

async function buscarPorInstalacao(numeroInstalacao) {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM propostas WHERE numero_instalacao = $1',
    [numeroInstalacao]
  );
  return rows[0];
}

module.exports = {
  inserir,
  buscarTodas,
  buscarPorInstalacao
};
>>>>>>> b52c59025a5e31c6d8b81637195ee70976af80b7
