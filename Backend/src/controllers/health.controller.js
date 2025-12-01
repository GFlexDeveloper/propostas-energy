<<<<<<< HEAD
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
=======
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
>>>>>>> b52c59025a5e31c6d8b81637195ee70976af80b7
