/**
 * Controllers de usuário (perfil próprio).
 */
const UserService = require('../services/user.service');

const UserController = {
  getMe(req, res, next) {
    try {
      const user = UserService.getProfile(req.user.id);
      return res.json(user);
    } catch (err) {
      return next(err);
    }
  },

  updateMe(req, res, next) {
    try {
      const user = UserService.updateProfile(req.user.id, req.body || {});
      return res.json(user);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = UserController;
