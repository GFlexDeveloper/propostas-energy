<<<<<<< HEAD
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
=======
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
>>>>>>> b52c59025a5e31c6d8b81637195ee70976af80b7
