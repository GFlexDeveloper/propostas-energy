const service = require('../services/health.service');

async function healthCheck(req, res, next) {
  try {
    const status = await service.getHealthStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  healthCheck
};
