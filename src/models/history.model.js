/**
 * Histórico de cancelamentos.
 * Mantém um registro auditável de cada cancelamento (cliente ou administrador).
 */
const db = require('../database/memoryDB');

const HistoryModel = {
  add(entry) {
    db.cancellationHistory.push(entry);
    return entry;
  },

  findAll() {
    return db.cancellationHistory;
  },

  findByReservation(reservationId) {
    return db.cancellationHistory.filter(
      (h) => h.reservationId === reservationId
    );
  },
};

module.exports = HistoryModel;
