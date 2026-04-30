/**
 * Controllers de reservas.
 * Encaminha chamadas ao service correspondente.
 */
const ReservationService = require('../services/reservation.service');

const ReservationController = {
  create(req, res, next) {
    try {
      const reservation = ReservationService.create(req.user, req.body || {});
      return res.status(201).json(reservation);
    } catch (err) {
      return next(err);
    }
  },

  list(req, res, next) {
    try {
      const items = ReservationService.list(req.user, {
        from: req.query.from,
        to: req.query.to,
        includeAll: req.query.all === 'true',
      });
      return res.json(items);
    } catch (err) {
      return next(err);
    }
  },

  getById(req, res, next) {
    try {
      const reservation = ReservationService.getById(req.user, req.params.id);
      return res.json(reservation);
    } catch (err) {
      return next(err);
    }
  },

  cancel(req, res, next) {
    try {
      const reservation = ReservationService.cancelByClient(
        req.user,
        req.params.id
      );
      return res.json(reservation);
    } catch (err) {
      return next(err);
    }
  },

  cancelByAdmin(req, res, next) {
    try {
      const reservation = ReservationService.cancelByAdmin(
        req.user,
        req.params.id,
        (req.body || {}).reason
      );
      return res.json(reservation);
    } catch (err) {
      return next(err);
    }
  },

  deliver(req, res, next) {
    try {
      const reservation = ReservationService.markDelivered(
        req.user,
        req.params.id
      );
      return res.json(reservation);
    } catch (err) {
      return next(err);
    }
  },

  history(req, res, next) {
    try {
      const items = ReservationService.cancellationHistory(
        req.user,
        req.query.reservationId
      );
      return res.json(items);
    } catch (err) {
      return next(err);
    }
  },

  availability(req, res, next) {
    try {
      const data = ReservationService.getAvailability(req.query.date);
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = ReservationController;
