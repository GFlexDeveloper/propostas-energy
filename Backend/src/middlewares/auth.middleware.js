const { AuthError } = require('../utils/errors');
const tokenService = require('../services/token.service');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(new AuthError('Token não fornecido'));
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return next(new AuthError('Formato de autorização inválido'));
  }

  try {
    const payload = tokenService.verificarToken(token);
    req.usuario = payload;
    next();
  } catch (err) {
    next(new AuthError('Token inválido ou expirado'));
  }
}

module.exports = { authMiddleware };
