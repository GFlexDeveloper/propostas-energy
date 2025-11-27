const { getPool } = require('../config/database');

async function buscarPorEmail(email) {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM usuarios WHERE email = $1',
    [email]
  );
  return rows[0];
}

async function criar({ nome, email, senhaHash }) {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [nome, email, senhaHash]
  );
  return rows[0];
}

module.exports = {
  buscarPorEmail,
  criar
};
