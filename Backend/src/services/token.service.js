<<<<<<< HEAD
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function gerarToken(payload, expiresIn = '8h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  gerarToken,
  verificarToken
};
=======
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function gerarToken(payload, expiresIn = '8h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  gerarToken,
  verificarToken
};
>>>>>>> b52c59025a5e31c6d8b81637195ee70976af80b7
