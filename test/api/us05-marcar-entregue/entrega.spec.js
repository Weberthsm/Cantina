/**
 * US05 — Marcar como entregue (administrador)
 * Casos cobertos: TC01, TC02, TC03, TC04, TC06 (TC05 é camada Web).
 */
const { expect } = require('chai');
const { createClientReady, loginAsAdmin } = require('../../helpers/auth');
const { createReservation, deliver, cancelReservation } = require('../../helpers/reservations');
const { uniqueFutureDate } = require('../../helpers/dates');
const http = require('../../helpers/http');

describe('US05 — Marcar como entregue (administrador)', () => {
  let admin;
  before(async () => {
    admin = await loginAsAdmin();
  });

  describe('Regras de negócio', () => {
    it('TC01 — Administrador marca reserva ativa como entregue (CT01, CT02, CT04)', async () => {
      const cli = await createClientReady();
      const created = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'almoco',
      });
      expect(created.status).to.equal(201);

      const res = await deliver(admin.token, created.body.id);
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ status: 'entregue' });
      expect(res.body).to.have.property('deliveredAt').that.is.a('string');
      expect(res.body).to.have.property('deliveredBy', admin.user.id);
    });

    it('TC03 — Tentativa de entregar reserva já entregue (CT02, CT03)', async () => {
      const cli = await createClientReady();
      const created = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'jantar',
      });
      expect(created.status).to.equal(201);
      await deliver(admin.token, created.body.id);

      const res = await deliver(admin.token, created.body.id);
      expect(res.status).to.equal(409);
      expect(res.body).to.have.property('error', 'Conflict');
    });

    it('TC04 — Tentativa de entregar reserva cancelada (CT02)', async () => {
      const cli = await createClientReady();
      const created = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'almoco',
      });
      expect(created.status).to.equal(201);
      await cancelReservation(cli.token, created.body.id);

      const res = await deliver(admin.token, created.body.id);
      expect(res.status).to.equal(409);
      expect(res.body).to.have.property('error', 'Conflict');
    });
  });

  describe('Permissões', () => {
    it('TC02 — Cliente comum tenta marcar como entregue (CT01)', async () => {
      const cli = await createClientReady();
      const created = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'almoco',
      });
      expect(created.status).to.equal(201);

      const res = await http()
        .patch(`/reservations/${created.body.id}/deliver`)
        .set('Authorization', `Bearer ${cli.token}`);
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error', 'Forbidden');
    });

    it('TC06 — Tentativa de entrega sem autenticação (CT01)', async () => {
      const res = await http().patch('/reservations/algum-id/deliver');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });
});
