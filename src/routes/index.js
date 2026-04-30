/**
 * Agregador de rotas. Monta os módulos sob seus prefixos.
 */
const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const reservationRoutes = require('./reservation.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reservations', reservationRoutes);

router.get('/', (req, res) => {
  res.json({
    name: 'Cantina API',
    version: '1.0.0',
    docs: '/api-docs',
  });
});

module.exports = router;
