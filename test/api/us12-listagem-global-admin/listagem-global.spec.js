/**
 * US12 — Listagem global pelo administrador
 * Casos cobertos: TC01 a TC04, TC06 (TC05 é camada Web).
 */
const { expect } = require('chai');
const { createClientReady, loginAsAdmin } = require('../../helpers/auth');
const { createReservation, listReservations } = require('../../helpers/reservations');
const { uniqueFutureDate } = require('../../helpers/dates');
const http = require('../../helpers/http');

describe('US12 — Listagem global pelo administrador', () => {
  let admin;
  before(async () => {
    admin = await loginAsAdmin();
  });

  describe('Regras de negócio', () => {
    it('TC01 — Administrador lista todas as reservas com all=true (CT01, CT04)', async () => {
      // Cria reservas de 2 clientes diferentes.
      const a = await createClientReady();
      const b = await createClientReady();
      const r1 = await createReservation(a.token, { date: uniqueFutureDate(), mealType: 'almoco' });
      const r2 = await createReservation(b.token, { date: uniqueFutureDate(), mealType: 'jantar' });
      expect(r1.status).to.equal(201);
      expect(r2.status).to.equal(201);

      const res = await listReservations(admin.token, { all: 'true' });
      expect(res.status).to.equal(200);
      const ids = res.body.map((r) => r.id);
      expect(ids).to.include(r1.body.id);
      expect(ids).to.include(r2.body.id);

      // Ordem ascendente por data
      const dates = res.body.map((r) => r.date);
      const sorted = [...dates].sort();
      expect(dates).to.deep.equal(sorted);
    });

    it('TC02 — Administrador filtra listagem global por intervalo (CT02)', async () => {
      const a = await createClientReady();
      const dataAlvo = uniqueFutureDate();
      await createReservation(a.token, { date: dataAlvo, mealType: 'almoco' });

      const res = await listReservations(admin.token, {
        all: 'true',
        from: dataAlvo,
        to: dataAlvo,
      });
      expect(res.status).to.equal(200);
      res.body.forEach((r) => expect(r.date).to.equal(dataAlvo));
    });

    it('TC04 — Administrador sem flag global recebe somente próprias (CT03)', async () => {
      // O admin do seed pode ou não ter reservas; verificamos que tudo
      // que vier pertence ao admin.
      const res = await listReservations(admin.token);
      expect(res.status).to.equal(200);
      res.body.forEach((r) => expect(r.userId).to.equal(admin.user.id));
    });
  });

  describe('Permissões', () => {
    it('TC03 — Cliente solicita listagem global → recebe somente as próprias (CT01, CT03)', async () => {
      const cli = await createClientReady();
      const other = await createClientReady();
      const r1 = await createReservation(other.token, {
        date: uniqueFutureDate(),
        mealType: 'almoco',
      });
      expect(r1.status).to.equal(201);

      const res = await listReservations(cli.token, { all: 'true' });
      expect(res.status).to.equal(200);
      const ids = res.body.map((r) => r.id);
      expect(ids).to.not.include(r1.body.id);
      // Cliente só vê as próprias.
      res.body.forEach((r) => expect(r.userId).to.equal(cli.user.id));
    });

    it('TC06 — Tentativa sem autenticação (CT01)', async () => {
      const res = await http().get('/reservations').query({ all: 'true' });
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });
});
