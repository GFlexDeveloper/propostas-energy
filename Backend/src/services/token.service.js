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
