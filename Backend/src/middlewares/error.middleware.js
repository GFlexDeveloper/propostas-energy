const { logger } = require('../utils/logger');

function errorMiddleware(err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error('Erro não tratado:', err);

  const status = err.statusCode || 500;
  const message = err.message || 'Erro interno no servidor';

  res.status(status).json({
    success: false,
    message
  });
}

module.exports = { errorMiddleware };
