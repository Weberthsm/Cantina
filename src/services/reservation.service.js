/**
 * Service de reservas.
 *
 * Regras de negócio:
 * - Reservas exigem nome, cpf, endereço e telefone do cliente cadastrados.
 * - Reservas aceitam quantidade (campo `quantity`, padrão 1).
 * - Limite de 5 marmitas por usuário por dia (soma das quantidades de todas
 *   as reservas ativas desse usuário no dia).
 * - 1 reserva por refeição (almoço, jantar) por usuário no dia.
 * - Não permitir reservas para datas passadas.
 * - Reservas para o dia atual respeitam um horário de corte por refeição
 *   (almoço até 10h, jantar até 16h por padrão; configurável via .env).
 * - Estoque diário por refeição (50 para almoço e 50 para jantar por padrão;
 *   configurável via .env).
 * - Cancelamento pelo cliente: somente reservas próprias e antes do horário
 *   de corte da respectiva refeição.
 * - Cancelamento pelo administrador: pode ocorrer mesmo após o corte e exige motivo.
 * - Reservas entregues não podem ser canceladas ou alteradas.
 * - Marcar como entregue: apenas administradores e somente reservas com status "ativa".
 * - Manter histórico de cancelamentos.
 */
const { v4: uuid } = require('uuid');

const ReservationModel = require('../models/reservation.model');
const HistoryModel = require('../models/history.model');
const UserModel = require('../models/user.model');
const AppError = require('../utils/AppError');
const config = require('../config');
const { toISODate, todayISO, isPastDate, isAfterCutoff } = require('../utils/dateUtils');

/**
 * Retorna o horário de corte de uma refeição específica
 * (cai no genérico cutoffHour caso a refeição não tenha override).
 */
function cutoffFor(mealType) {
  const map = config.business.cutoffHourByMeal || {};
  return map[mealType] != null ? map[mealType] : config.business.cutoffHour;
}

/**
 * Retorna o estoque diário máximo de uma refeição específica
 * (cai no genérico defaultDailyStock caso a refeição não tenha override).
 */
function stockFor(mealType) {
  const map = config.business.defaultDailyStockByMeal || {};
  return map[mealType] != null ? map[mealType] : config.business.defaultDailyStock;
}

function ensureCustomerProfile(user) {
  const missing = [];
  if (!user.name) missing.push('nome');
  if (!user.cpf) missing.push('cpf');
  if (!user.address) missing.push('endereco');
  if (!user.phone) missing.push('telefone');
  if (missing.length) {
    throw new AppError(
      `Complete seu cadastro antes de reservar. Faltam: ${missing.join(', ')}.`,
      400,
      'ValidationError',
      { missing }
    );
  }
}

function validateMealType(mealType) {
  if (!config.mealTypes.includes(mealType)) {
    throw new AppError(
      `Tipo de refeição inválido. Use um de: ${config.mealTypes.join(', ')}.`,
      400,
      'ValidationError'
    );
  }
}

/** Normaliza/valida a quantidade. Padrão = 1. */
function parseQuantity(raw) {
  if (raw === undefined || raw === null || raw === '') return 1;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError(
      'Quantidade inválida. Informe um inteiro maior ou igual a 1.',
      400,
      'ValidationError'
    );
  }
  return n;
}

/** Soma a quantidade de uma lista de reservas (compatível com reservas antigas sem quantity). */
function sumQuantity(reservations) {
  return reservations.reduce((acc, r) => acc + (Number(r.quantity) || 1), 0);
}

const ReservationService = {
  /**
   * Cria uma reserva para o usuário autenticado.
   */
  create(user, payload) {
    ensureCustomerProfile(user);

    const date = toISODate(payload.date);
    if (!date) {
      throw new AppError(
        'Data inválida. Use o formato YYYY-MM-DD.',
        400,
        'ValidationError'
      );
    }

    validateMealType(payload.mealType);
    const quantity = parseQuantity(payload.quantity);

    if (isPastDate(date)) {
      throw new AppError(
        'Não é permitido reservar para datas passadas.',
        400,
        'BusinessRuleViolation'
      );
    }

    const mealCutoff = cutoffFor(payload.mealType);
    if (date === todayISO() && isAfterCutoff(mealCutoff)) {
      console.log(`teste ${mealCutoff}.`);
      throw new AppError(
        `Horário de corte do ${payload.mealType} (${mealCutoff}h) já ultrapassado para reservas de hoje.`,
        400,
        'BusinessRuleViolation'
      );
    }

    const userActiveOnDate = ReservationModel.findActiveByUserAndDate(
      user.id,
      date
    );

    // Limite diário por pessoa: soma das marmitas (não quantidade de reservas).
    const userQuantityOnDate = sumQuantity(userActiveOnDate);
    const maxPerDay = config.business.maxReservationsPerUserPerDay;
    if (userQuantityOnDate + quantity > maxPerDay) {
      const remaining = Math.max(0, maxPerDay - userQuantityOnDate);
      throw new AppError(
        `Limite de ${maxPerDay} marmitas por dia atingido. Você ainda pode reservar ${remaining}.`,
        400,
        'BusinessRuleViolation',
        { dailyLimit: maxPerDay, alreadyReserved: userQuantityOnDate, remaining }
      );
    }

    const duplicateMeal = userActiveOnDate.some(
      (r) => r.mealType === payload.mealType
    );
    if (duplicateMeal) {
      throw new AppError(
        `Você já possui uma reserva ativa de ${payload.mealType} nesse dia. Cancele-a ou aguarde para criar outra.`,
        409,
        'Conflict'
      );
    }

    const reservedForMeal = ReservationModel.findActiveByDateAndMeal(
      date,
      payload.mealType
    );
    const mealStock = stockFor(payload.mealType);
    const usedForMeal = sumQuantity(reservedForMeal);
    if (usedForMeal + quantity > mealStock) {
      const remaining = Math.max(0, mealStock - usedForMeal);
      throw new AppError(
        `Estoque insuficiente para ${payload.mealType} no dia ${date}. Restam ${remaining} de ${mealStock}.`,
        409,
        'Conflict',
        { stock: mealStock, used: usedForMeal, remaining }
      );
    }

    const reservation = {
      id: uuid(),
      userId: user.id,
      date,
      mealType: payload.mealType,
      quantity,
      status: config.reservationStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: null,
      deliveredAt: null,
    };

    return ReservationModel.create(reservation);
  },

  /**
   * Lista reservas do usuário autenticado, com filtros opcionais por intervalo.
   * Administradores podem listar todas as reservas via flag.
   */
  list(user, { from, to, includeAll = false } = {}) {
    let items;
    if (includeAll && user.role === config.roles.ADMIN) {
      items = ReservationModel.findAll();
    } else {
      items = ReservationModel.findByUser(user.id);
    }

    if (from) {
      const fromISO = toISODate(from);
      if (!fromISO) {
        throw new AppError(
          'Parâmetro from inválido. Use YYYY-MM-DD.',
          400,
          'ValidationError'
        );
      }
      items = items.filter((r) => r.date >= fromISO);
    }
    if (to) {
      const toISO = toISODate(to);
      if (!toISO) {
        throw new AppError(
          'Parâmetro to inválido. Use YYYY-MM-DD.',
          400,
          'ValidationError'
        );
      }
      items = items.filter((r) => r.date <= toISO);
    }

    return items.sort((a, b) => a.date.localeCompare(b.date));
  },

  getById(user, id) {
    const reservation = ReservationModel.findById(id);
    if (!reservation) {
      throw new AppError('Reserva não encontrada.', 404, 'NotFound');
    }
    if (
      reservation.userId !== user.id &&
      user.role !== config.roles.ADMIN
    ) {
      throw new AppError(
        'Você só pode visualizar reservas próprias.',
        403,
        'Forbidden'
      );
    }
    return reservation;
  },

  /**
   * Cancelamento pelo cliente.
   */
  cancelByClient(user, id) {
    const reservation = ReservationModel.findById(id);
    if (!reservation) {
      throw new AppError('Reserva não encontrada.', 404, 'NotFound');
    }
    if (reservation.userId !== user.id) {
      throw new AppError(
        'Você só pode cancelar reservas próprias.',
        403,
        'Forbidden'
      );
    }
    if (reservation.status === config.reservationStatus.CANCELLED) {
      throw new AppError('Reserva já cancelada.', 409, 'Conflict');
    }
    if (reservation.status === config.reservationStatus.DELIVERED) {
      throw new AppError(
        'Reservas entregues não podem ser canceladas.',
        409,
        'Conflict'
      );
    }
    const reservationCutoff = cutoffFor(reservation.mealType);
    if (
      reservation.date === todayISO() &&
      isAfterCutoff(reservationCutoff)
    ) {
      throw new AppError(
        `Cancelamento do ${reservation.mealType} só é permitido antes do horário de corte (${reservationCutoff}h).`,
        400,
        'BusinessRuleViolation'
      );
    }

    const updated = ReservationModel.update(id, {
      status: config.reservationStatus.CANCELLED,
      cancelledAt: new Date().toISOString(),
      cancelledBy: user.id,
      cancelReason: 'Cancelado pelo cliente',
    });

    HistoryModel.add({
      id: uuid(),
      reservationId: id,
      cancelledBy: user.id,
      cancelledByRole: config.roles.CLIENT,
      reason: 'Cancelado pelo cliente',
      cancelledAt: updated.cancelledAt,
    });

    return updated;
  },

  /**
   * Cancelamento pelo administrador, com motivo. Pode ocorrer após corte.
   */
  cancelByAdmin(adminUser, id, reason) {
    const reservation = ReservationModel.findById(id);
    if (!reservation) {
      throw new AppError('Reserva não encontrada.', 404, 'NotFound');
    }
    if (reservation.status === config.reservationStatus.CANCELLED) {
      throw new AppError('Reserva já cancelada.', 409, 'Conflict');
    }
    if (reservation.status === config.reservationStatus.DELIVERED) {
      throw new AppError(
        'Reservas entregues não podem ser canceladas.',
        409,
        'Conflict'
      );
    }
    if (!reason || !reason.trim()) {
      throw new AppError(
        'Motivo do cancelamento é obrigatório.',
        400,
        'ValidationError'
      );
    }

    const updated = ReservationModel.update(id, {
      status: config.reservationStatus.CANCELLED,
      cancelledAt: new Date().toISOString(),
      cancelledBy: adminUser.id,
      cancelReason: reason.trim(),
    });

    HistoryModel.add({
      id: uuid(),
      reservationId: id,
      cancelledBy: adminUser.id,
      cancelledByRole: config.roles.ADMIN,
      reason: reason.trim(),
      cancelledAt: updated.cancelledAt,
    });

    // Notificação ao cliente — simulada via log.
    const client = UserModel.findById(reservation.userId);
    if (client) {
      console.log(
        `[NOTIFICACAO] Cliente ${client.email}: sua reserva ${id} foi cancelada pelo administrador. Motivo: ${reason}`
      );
    }

    return updated;
  },

  /**
   * Marca reserva como entregue (somente admin, somente reservas ativas).
   */
  markDelivered(adminUser, id) {
    const reservation = ReservationModel.findById(id);
    if (!reservation) {
      throw new AppError('Reserva não encontrada.', 404, 'NotFound');
    }
    if (reservation.status !== config.reservationStatus.ACTIVE) {
      throw new AppError(
        'Apenas reservas com status "ativa" podem ser marcadas como entregues.',
        409,
        'Conflict'
      );
    }
    return ReservationModel.update(id, {
      status: config.reservationStatus.DELIVERED,
      deliveredAt: new Date().toISOString(),
      deliveredBy: adminUser.id,
    });
  },

  cancellationHistory(adminUser, reservationId) {
    if (reservationId) {
      return HistoryModel.findByReservation(reservationId);
    }
    return HistoryModel.findAll();
  },

  /**
   * Disponibilidade de marmitas em uma data específica para todas as refeições.
   * `used` é a soma das quantidades das reservas ativas (canceladas/entregues
   * não consomem estoque). Cada refeição também devolve o seu horário de corte.
   *
   * Retorno:
   *   {
   *     date: "YYYY-MM-DD",
   *     almoco: { stock, used, available, cutoffHour },
   *     jantar: { stock, used, available, cutoffHour },
   *   }
   */
  getAvailability(date) {
    const iso = toISODate(date);
    if (!iso) {
      throw new AppError(
        'Data inválida. Use o formato YYYY-MM-DD.',
        400,
        'ValidationError'
      );
    }

    const result = { date: iso };
    for (const mealType of config.mealTypes) {
      const stock = stockFor(mealType);
      const used = sumQuantity(
        ReservationModel.findActiveByDateAndMeal(iso, mealType)
      );
      const available = Math.max(0, stock - used);
      const cutoffHour = cutoffFor(mealType);
      result[mealType] = { stock, used, available, cutoffHour };
    }
    return result;
  },
};

module.exports = ReservationService;
