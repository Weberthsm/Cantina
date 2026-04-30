/**
 * Middlewares de autenticação e autorização baseados em JWT.
 *
 * - authenticate: extrai o token do header Authorization, valida e injeta
 *   o usuário em req.user.
 * - requireAdmin: garante que o usuário autenticado tem perfil de administrador.
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const UserModel = require('../models/user.model');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token não enviado. Use o header Authorization: Bearer <token>.',
    });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = UserModel.findById(payload.sub);

    if (!user) {
      return res
        .status(401)
        .json({ error: 'Unauthorized', message: 'Usuário não encontrado.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Usuário bloqueado. Realize a recuperação de senha.',
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res
      .status(401)
      .json({ error: 'Unauthorized', message: 'Token inválido ou expirado.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== config.roles.ADMIN) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Apenas administradores podem acessar este recurso.',
    });
  }
  return next();
}

module.exports = { authenticate, requireAdmin };
