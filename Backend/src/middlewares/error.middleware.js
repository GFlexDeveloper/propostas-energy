<<<<<<< HEAD
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
=======
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
>>>>>>> b52c59025a5e31c6d8b81637195ee70976af80b7
