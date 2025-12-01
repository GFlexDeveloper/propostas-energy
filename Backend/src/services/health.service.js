// Backend/src/services/health.service.js
const { getPool } = require('../config/database');

async function getHealthStatus() {
  // Teste simples de conexão com o banco
  const pool = getPool();
  await pool.query('SELECT 1');

  return {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getHealthStatus
};
