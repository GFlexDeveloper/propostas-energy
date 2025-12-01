<<<<<<< HEAD
const { Pool } = require('pg');
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } = require('./env');
const { logger } = require('../utils/logger');

let pool;

async function initDatabase() {
  pool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE
  });

  const client = await pool.connect();
  client.release();
}

function getPool() {
  if (!pool) {
    throw new Error('Pool de conexões não inicializado. Chame initDatabase() primeiro.');
  }
  return pool;
}

module.exports = {
  initDatabase,
  getPool
};
=======
const { Pool } = require('pg');
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } = require('./env');
const { logger } = require('../utils/logger');

let pool;

async function initDatabase() {
  pool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE
  });

  const client = await pool.connect();
  client.release();
  logger.info('✅ Conectado ao PostgreSQL');
}

function getPool() {
  if (!pool) {
    throw new Error('Pool de conexões não inicializado. Chame initDatabase() primeiro.');
  }
  return pool;
}

module.exports = {
  initDatabase,
  getPool
};
>>>>>>> b52c59025a5e31c6d8b81637195ee70976af80b7
