/**
 * Rotas de autenticação (públicas).
 */
const { Router } = require('express');
const AuthController = require('../controllers/auth.controller');

const router = Router();

router.post('/register', AuthController.register);
router.get('/confirm-email/:token', AuthController.confirmEmail);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

module.exports = router;
