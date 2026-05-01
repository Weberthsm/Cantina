/**
 * US06 — Cancelamento pelo administrador
 * Casos cobertos: TC01 a TC05 (TC06 é camada Web).
 */
const { expect } = require('chai');
const { createClientReady, loginAsAdmin } = require('../../helpers/auth');
const { createReservation, adminCancel, deliver, getHistory } = require('../../helpers/reservations');
const { uniqueFutureDate } = require('../../helpers/dates');
const fixtures = require('../../fixtures/invalid-payloads.json');
const http = require('../../helpers/http');

describe('US06 — Cancelamento pelo administrador', () => {
  let admin;
  before(async () => {
    admin = await loginAsAdmin();
  });

  describe('Regras de negócio', () => {
    it('TC01 — Administrador cancela reserva com motivo (CT01, CT02, CT05, CT06)', async () => {
      const cli = await createClientReady();
      const created = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'almoco',
      });
      expect(created.status).to.equal(201);

      const reason = 'Cantina fechada por evento';
      const res = await adminCancel(admin.token, created.body.id, reason);
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ status: 'cancelada', cancelReason: reason });

      const hist = await getHistory(admin.token, { reservationId: created.body.id });
      expect(hist.status).to.equal(200);
      expect(hist.body).to.be.an('array').that.has.lengthOf(1);
      expect(hist.body[0]).to.include({
        reason,
        cancelledByRole: 'admin',
        cancelledBy: admin.user.id,
      });
    });

    it('TC04 — Tentativa de cancelar reserva já entregue (CT04)', async () => {
      const cli = await createClientReady();
      const created = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'jantar',
      });
      await deliver(admin.token, created.body.id);

      const res = await adminCancel(admin.token, created.body.id, 'qualquer motivo');
      expect(res.status).to.equal(409);
      expect(res.body).to.have.property('error', 'Conflict');
    });
  });

  describe('Validações', () => {
    fixtures.us06_motivo_em_branco.forEach(({ description, reason }) => {
      it(`TC03 — Tentativa de cancelar sem motivo [${description}] (CT02)`, async () => {
        const cli = await createClientReady();
        const created = await createReservation(cli.token, {
          date: uniqueFutureDate(),
          mealType: 'almoco',
        });
        expect(created.status).to.equal(201);

        const payload = reason === null ? {} : { reason };
        const res = await http()
          .patch(`/reservations/${created.body.id}/admin-cancel`)
          .set('Authorization', `Bearer ${admin.token}`)
          .send(payload);
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('error', 'ValidationError');
      });
    });
  });

  describe('Permissões', () => {
    it('TC05 — Cliente comum tenta cancelar reserva de terceiro (CT01)', async () => {
      const cli = await createClientReady();
      const other = await createClientReady();
      const created = await createReservation(other.token, {
        date: uniqueFutureDate(),
        mealType: 'almoco',
      });
      expect(created.status).to.equal(201);

      const res = await http()
        .patch(`/reservations/${created.body.id}/admin-cancel`)
        .set('Authorization', `Bearer ${cli.token}`)
        .send({ reason: 'tentando' });
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error', 'Forbidden');
    });
  });
});
