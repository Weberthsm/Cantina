/**
 * Utilitários de data para uso nas regras de reserva.
 * Mantém o tratamento em string YYYY-MM-DD para comparação consistente.
 */
function toISODate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Verifica se a data alvo é anterior a hoje.
 */
function isPastDate(targetDate) {
  return targetDate < todayISO();
}

/**
 * Indica se já passou do horário de corte do dia (apenas relevante para reservas de hoje).
 */
function isAfterCutoff(cutoffHour) {
  return new Date().getHours() >= cutoffHour;
}

module.exports = { toISODate, todayISO, isPastDate, isAfterCutoff };
