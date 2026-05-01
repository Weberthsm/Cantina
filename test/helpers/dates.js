/**
 * Datas determinísticas para os testes — sempre futuras e variadas para
 * evitar colisão entre cenários e com o limite diário do mesmo usuário.
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

function isoDate(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function todayISO() {
  return isoDate(new Date());
}

function daysFromTodayISO(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}

function uniqueFutureDate() {
  // 2 a 1100 dias no futuro para reduzir colisão com outros testes.
  const offset = Math.floor(Math.random() * 1098) + 2;
  return daysFromTodayISO(offset);
}

module.exports = { todayISO, daysFromTodayISO, uniqueFutureDate, isoDate };
