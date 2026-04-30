/**
 * Rotas de reservas (todas autenticadas).
 * As rotas administrativas exigem perfil admin.
 */
const { Router } = require('express');
const ReservationController = require('../controllers/reservation.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

router.post('/', ReservationController.create);
router.get('/', ReservationController.list);
router.get('/availability', ReservationController.availability);
router.get('/history', requireAdmin, ReservationController.history);
router.get('/:id', ReservationController.getById);
router.delete('/:id', ReservationController.cancel);

router.patch('/:id/deliver', requireAdmin, ReservationController.deliver);
router.patch('/:id/admin-cancel', requireAdmin, ReservationController.cancelByAdmin);

module.exports = router;
