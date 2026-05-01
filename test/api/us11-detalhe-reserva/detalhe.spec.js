/**
 * US11 — Detalhe de uma reserva
 * Casos cobertos: TC01 a TC04, TC06 (TC05 é camada Web).
 */
const { expect } = require('chai');
const { createClientReady, loginAsAdmin } = require('../../helpers/auth');
const { createReservation, getReservation } = require('../../helpers/reservations');
const { uniqueFutureDate } = require('../../helpers/dates');
const http = require('../../helpers/http');

describe('US11 — Detalhe de uma reserva', () => {
  describe('Regras de negócio', () => {
    it('TC01 — Cliente consulta detalhe de reserva própria (CT01, CT04)', async () => {
      const cli = await createClientReady();
      const created = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'almoco',
        quantity: 2,
      });
      expect(created.status).to.equal(201);

      const res = await getReservation(cli.token, created.body.id);
      expect(res.status).to.equal(200);
      expect(res.body).to.include({
        id: created.body.id,
        status: 'ativa',
        mealType: 'almoco',
        quantity: 2,
      });
      expect(res.body).to.have.property('date');
      expect(res.body).to.have.property('createdAt');
    });

    it('TC03 — Administrador consulta reserva de qualquer cliente (CT02)', async () => {
      const cli = await createClientReady();
      const admin = await loginAsAdmin();
      const created = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'jantar',
      });
      const res = await getReservation(admin.token, created.body.id);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', created.body.id);
    });
  });

  describe('Permissões e estado', () => {
    it('TC02 — Cliente tenta consultar reserva de terceiro (CT01)', async () => {
      const owner = await createClientReady();
      const other = await createClientReady();
      const created = await createReservation(owner.token, {
        date: uniqueFutureDate(),
        mealType: 'almoco',
      });
      expect(created.status).to.equal(201);

      const res = await getReservation(other.token, created.body.id);
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error', 'Forbidden');
    });

    it('TC04 — Identificador inexistente (CT03)', async () => {
      const cli = await createClientReady();
      const res = await getReservation(cli.token, '00000000-0000-0000-0000-000000000000');
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error', 'NotFound');
    });

    it('TC06 — Tentativa de consulta sem autenticação (CT01)', async () => {
      const res = await http().get('/reservations/qualquer-id');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });
});
