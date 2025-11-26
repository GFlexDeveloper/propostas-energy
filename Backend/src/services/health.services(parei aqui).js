const { getPool } = require('../config/database');

async function getHealthStatus() {
  const pool = getPool();
  await pool.query('SELECT 1'); // teste simples de conexão

  return {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getHealthStatus
};
