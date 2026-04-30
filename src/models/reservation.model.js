/**
 * Acesso à coleção de reservas no banco em memória.
 */
const db = require('../database/memoryDB');

const ReservationModel = {
  findAll() {
    return db.reservations;
  },

  findById(id) {
    return db.reservations.find((r) => r.id === id) || null;
  },

  findByUser(userId) {
    return db.reservations.filter((r) => r.userId === userId);
  },

  /**
   * Reservas ativas em uma data + tipo de refeição.
   * Usado para verificar disponibilidade de estoque.
   */
  findActiveByDateAndMeal(date, mealType) {
    return db.reservations.filter(
      (r) =>
        r.date === date &&
        r.mealType === mealType &&
        r.status === 'ativa'
    );
  },

  /**
   * Reservas ativas de um usuário em uma data.
   */
  findActiveByUserAndDate(userId, date) {
    return db.reservations.filter(
      (r) => r.userId === userId && r.date === date && r.status === 'ativa'
    );
  },

  create(reservation) {
    db.reservations.push(reservation);
    return reservation;
  },

  update(id, patch) {
    const idx = db.reservations.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    db.reservations[idx] = { ...db.reservations[idx], ...patch };
    return db.reservations[idx];
  },
};

module.exports = ReservationModel;
