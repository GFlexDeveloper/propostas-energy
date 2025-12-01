const service = require('../services/auth.service');

async function registrar(req, res, next) {
  try {
    const result = await service.registrar(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await service.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registrar,
  login
};
