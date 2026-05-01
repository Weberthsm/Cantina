/**
 * Helpers para operações de reserva (CRUD via API).
 */
const http = require('./http');

async function createReservation(token, payload) {
  return http()
    .post('/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

async function listReservations(token, query = {}) {
  return http().get('/reservations').set('Authorization', `Bearer ${token}`).query(query);
}

async function getReservation(token, id) {
  return http().get(`/reservations/${id}`).set('Authorization', `Bearer ${token}`);
}

async function cancelReservation(token, id) {
  return http().delete(`/reservations/${id}`).set('Authorization', `Bearer ${token}`);
}

async function deliver(adminToken, id) {
  return http()
    .patch(`/reservations/${id}/deliver`)
    .set('Authorization', `Bearer ${adminToken}`);
}

async function adminCancel(adminToken, id, reason) {
  return http()
    .patch(`/reservations/${id}/admin-cancel`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ reason });
}

async function getAvailability(token, date) {
  return http()
    .get('/reservations/availability')
    .set('Authorization', `Bearer ${token}`)
    .query({ date });
}

async function getHistory(adminToken, query = {}) {
  return http()
    .get('/reservations/history')
    .set('Authorization', `Bearer ${adminToken}`)
    .query(query);
}

module.exports = {
  createReservation,
  listReservations,
  getReservation,
  cancelReservation,
  deliver,
  adminCancel,
  getAvailability,
  getHistory,
};
