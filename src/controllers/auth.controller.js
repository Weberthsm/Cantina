/**
 * Controllers para autenticação.
 * Cada handler delega regras ao service e formata a resposta HTTP.
 */
const AuthService = require('../services/auth.service');

const AuthController = {
  register(req, res, next) {
    try {
      const result = AuthService.register(req.body || {});
      return res.status(201).json({
        message:
          'Cadastro realizado. Confirme o e-mail antes de fazer login (use o token retornado).',
        user: result.user,
        confirmationToken: result.confirmationToken,
      });
    } catch (err) {
      return next(err);
    }
  },

  confirmEmail(req, res, next) {
    try {
      const { token } = req.params;
      AuthService.confirmEmail(token);
      return res.json({ message: 'E-mail confirmado com sucesso.' });
    } catch (err) {
      return next(err);
    }
  },

  login(req, res, next) {
    try {
      const result = AuthService.login(req.body || {});
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  },

  forgotPassword(req, res, next) {
    try {
      const { email } = req.body || {};
      const result = AuthService.requestPasswordRecovery(email);
      return res.json({
        message:
          'Caso o e-mail exista, um token de recuperação foi enviado. (Em desenvolvimento, o token é retornado nesta resposta.)',
        ...result,
      });
    } catch (err) {
      return next(err);
    }
  },

  resetPassword(req, res, next) {
    try {
      const result = AuthService.resetPassword(req.body || {});
      return res.json({ message: 'Senha alterada com sucesso.', ...result });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = AuthController;
