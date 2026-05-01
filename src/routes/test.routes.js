const express = require('express');
const db = require('../database/memoryDB');
const { seedAdminUser } = require('../database/seed');

const router = express.Router();

// Limpa o banco em memória e reexecuta o seed.
// Disponível apenas quando NODE_ENV === 'test' (montado condicionalmente em app.js).
router.post('/reset', (req, res) => {
  db.users.length = 0;
  db.reservations.length = 0;
  db.cancellationHistory.length = 0;
  Object.keys(db.stockOverrides).forEach((k) => delete db.stockOverrides[k]);
  Object.keys(db.emailConfirmationTokens).forEach(
    (k) => delete db.emailConfirmationTokens[k]
  );
  Object.keys(db.passwordRecoveryTokens).forEach(
    (k) => delete db.passwordRecoveryTokens[k]
  );
  seedAdminUser();
  res.json({ ok: true, message: 'Banco reiniciado com seed.' });
});

module.exports = router;
