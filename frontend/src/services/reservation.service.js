/**
 * Wrapper sobre /reservations (incluindo operações administrativas).
 */
import http from './http';

export const ReservationService = {
  list({ from, to, all } = {}) {
    return http
      .get('/reservations', { params: { from, to, all: all || undefined } })
      .then((r) => r.data);
  },
  get(id) {
    return http.get(`/reservations/${id}`).then((r) => r.data);
  },
  create(payload) {
    return http.post('/reservations', payload).then((r) => r.data);
  },
  cancel(id) {
    return http.delete(`/reservations/${id}`).then((r) => r.data);
  },
  deliver(id) {
    return http.patch(`/reservations/${id}/deliver`).then((r) => r.data);
  },
  adminCancel(id, reason) {
    return http
      .patch(`/reservations/${id}/admin-cancel`, { reason })
      .then((r) => r.data);
  },
  history({ reservationId } = {}) {
    return http
      .get('/reservations/history', { params: { reservationId } })
      .then((r) => r.data);
  },
  availability(date) {
    return http
      .get('/reservations/availability', { params: { date } })
      .then((r) => r.data);
  },
};
