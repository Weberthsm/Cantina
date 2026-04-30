/**
 * Rotas de perfil de usuário (autenticadas).
 */
const { Router } = require('express');
const UserController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/me', UserController.getMe);
router.patch('/me', UserController.updateMe);

module.exports = router;
