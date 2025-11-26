const healthService = require('../services/health.service');

async function healthCheck(req, res, next) {
  try {
    const status = await healthService.getHealthStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
}

async function estatisticas(req, res, next) {
  try {
    const data = await healthService.getStatistics();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  healthCheck,
  estatisticas
};
