/**
 * Configurações centrais da aplicação.
 * Lê variáveis de ambiente, fornecendo valores padrão para desenvolvimento.
 */

/** Faz parseInt com fallback explícito (NaN/undefined/'' viram undefined). */
function parseIntOrUndefined(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Resolve o primeiro valor definido, na ordem de preferência. */
function pick(...values) {
  for (const v of values) {
    if (v !== undefined) return v;
  }
  return undefined;
}

const legacyCutoff = parseIntOrUndefined(process.env.CUTOFF_HOUR);
const legacyStock = parseIntOrUndefined(process.env.DEFAULT_DAILY_STOCK);

module.exports = {
  port: parseIntOrUndefined(process.env.PORT) ?? 3000,
  jwt: {
    secret: process.env.JWT_SECRET || 'cantina-secret-dev-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  business: {
    /**
     * Estoque diário por tipo de refeição.
     * Cada refeição tem sua própria quantidade máxima de marmitas por dia.
     *
     * Padrões: 50 para almoço e 50 para jantar.
     * Pode ser sobrescrito via .env (DEFAULT_DAILY_STOCK_ALMOCO,
     * DEFAULT_DAILY_STOCK_JANTAR). A variável legada DEFAULT_DAILY_STOCK,
     * se presente, vira o padrão para ambas.
     */
    defaultDailyStockByMeal: {
      almoco: pick(
        parseIntOrUndefined(process.env.DEFAULT_DAILY_STOCK_ALMOCO),
        legacyStock,
        50
      ),
      jantar: pick(
        parseIntOrUndefined(process.env.DEFAULT_DAILY_STOCK_JANTAR),
        legacyStock,
        50
      ),
    },
    // Mantido para retrocompatibilidade em logs/exibições genéricas.
    defaultDailyStock: legacyStock ?? 50,
    maxReservationsPerUserPerDay:
      parseIntOrUndefined(process.env.MAX_RESERVATIONS_PER_USER_PER_DAY) ?? 5,
    /**
     * Horário de corte por tipo de refeição.
     * Cada refeição tem o seu próprio limite de hora para criar/cancelar
     * reservas no mesmo dia.
     *
     * Padrões: almoço até 10h, jantar até 16h.
     * Pode ser sobrescrito via .env (CUTOFF_HOUR_ALMOCO, CUTOFF_HOUR_JANTAR).
     * A variável legada CUTOFF_HOUR, se presente, vira o padrão para ambas.
     */
    cutoffHourByMeal: {
      almoco: pick(
        parseIntOrUndefined(process.env.CUTOFF_HOUR_ALMOCO),
        legacyCutoff,
        10
      ),
      jantar: pick(
        parseIntOrUndefined(process.env.CUTOFF_HOUR_JANTAR),
        legacyCutoff,
        16
      ),
    },
    // Mantido para retrocompatibilidade em logs/exibições genéricas.
    cutoffHour: legacyCutoff ?? 10,
    maxFailedLoginAttempts: 5,
  },
  reservationStatus: {
    ACTIVE: 'ativa',
    CANCELLED: 'cancelada',
    DELIVERED: 'entregue',
  },
  mealTypes: ['almoco', 'jantar'],
  roles: {
    CLIENT: 'client',
    ADMIN: 'admin',
  },
};
