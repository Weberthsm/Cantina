/**
 * US13 — Histórico de cancelamentos (administrador)
 * Casos cobertos: TC01, TC02, TC03, TC05 (TC04 é camada Web).
 */
const { expect } = require('chai');
const { createClientReady, loginAsAdmin } = require('../../helpers/auth');
const {
  createReservation,
  cancelReservation,
  adminCancel,
  getHistory,
} = require('../../helpers/reservations');
const { uniqueFutureDate } = require('../../helpers/dates');
const http = require('../../helpers/http');

describe('US13 — Histórico de cancelamentos (administrador)', () => {
  let admin;
  before(async () => {
    admin = await loginAsAdmin();
  });

  describe('Regras de negócio', () => {
    it('TC01 — Administrador consulta o histórico completo (CT01, CT03)', async () => {
      // Provoca um cancelamento de cliente e um de admin.
      const cli = await createClientReady();
      const r1 = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'almoco',
      });
      const r2 = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'jantar',
      });
      await cancelReservation(cli.token, r1.body.id);
      await adminCancel(admin.token, r2.body.id, 'Motivo administrativo');

      const res = await getHistory(admin.token);
      expect(res.status).to.equal(200);
      const reservasNoHist = res.body.map((h) => h.reservationId);
      expect(reservasNoHist).to.include(r1.body.id);
      expect(reservasNoHist).to.include(r2.body.id);

      const fromClient = res.body.find((h) => h.reservationId === r1.body.id);
      const fromAdmin = res.body.find((h) => h.reservationId === r2.body.id);
      expect(fromClient).to.have.property('cancelledByRole', 'client');
      expect(fromAdmin).to.have.property('cancelledByRole', 'admin');
      expect(fromAdmin).to.have.property('reason', 'Motivo administrativo');
    });

    it('TC02 — Administrador filtra histórico por reserva (CT02)', async () => {
      const cli = await createClientReady();
      const created = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'almoco',
      });
      await adminCancel(admin.token, created.body.id, 'Filtro');

      const res = await getHistory(admin.token, { reservationId: created.body.id });
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').that.has.lengthOf(1);
      expect(res.body[0]).to.include({ reservationId: created.body.id, reason: 'Filtro' });
    });
  });

  describe('Permissões', () => {
    it('TC03 — Cliente tenta consultar o histórico (CT01)', async () => {
      const cli = await createClientReady();
      const res = await http()
        .get('/reservations/history')
        .set('Authorization', `Bearer ${cli.token}`);
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error', 'Forbidden');
    });

    it('TC05 — Tentativa sem autenticação (CT01)', async () => {
      const res = await http().get('/reservations/history');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });
});
