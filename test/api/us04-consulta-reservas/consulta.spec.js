/**
 * US04 — Consultar reservas por data
 * Casos cobertos: TC01, TC02, TC03, TC05 (TC04 é camada Web).
 */
const { expect } = require('chai');
const { createClientReady } = require('../../helpers/auth');
const { createReservation, listReservations } = require('../../helpers/reservations');
const { uniqueFutureDate } = require('../../helpers/dates');
const fixtures = require('../../fixtures/invalid-payloads.json');
const http = require('../../helpers/http');

describe('US04 — Consultar reservas por data', () => {
  describe('Regras de negócio', () => {
    it('TC01 — Cliente lista suas reservas em um intervalo (CT01, CT02, CT04, CT05)', async () => {
      const cli = await createClientReady();
      const d1 = uniqueFutureDate();
      const d2 = uniqueFutureDate();
      const r1 = await createReservation(cli.token, { date: d1, mealType: 'almoco' });
      const r2 = await createReservation(cli.token, { date: d2, mealType: 'jantar' });
      expect(r1.status).to.equal(201);
      expect(r2.status).to.equal(201);

      const res = await listReservations(cli.token);
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').that.has.length.greaterThanOrEqual(2);
      const ids = res.body.map((r) => r.id);
      expect(ids).to.include(r1.body.id);
      expect(ids).to.include(r2.body.id);
      // Ordem ascendente por data
      const dates = res.body.map((r) => r.date);
      const sorted = [...dates].sort();
      expect(dates).to.deep.equal(sorted);
      // Status visível
      res.body.forEach((r) => {
        expect(['ativa', 'cancelada', 'entregue']).to.include(r.status);
      });
    });

    it('TC02 — Cliente não enxerga reservas de terceiros (CT01)', async () => {
      const a = await createClientReady();
      const b = await createClientReady();
      const r1 = await createReservation(a.token, {
        date: uniqueFutureDate(),
        mealType: 'almoco',
      });
      expect(r1.status).to.equal(201);

      const lista = await listReservations(b.token);
      expect(lista.status).to.equal(200);
      const ids = lista.body.map((r) => r.id);
      expect(ids).to.not.include(r1.body.id);
      // Todas as reservas listadas pertencem ao próprio cliente B.
      lista.body.forEach((r) => {
        expect(r.userId).to.equal(b.user.id);
      });
    });
  });

  describe('Validações', () => {
    fixtures.us04_filtros_invalidos.forEach(({ description, query }) => {
      it(`TC03 — Filtro com data em formato inválido [${description}] (CT03)`, async () => {
        const cli = await createClientReady();
        const res = await listReservations(cli.token, query);
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('error', 'ValidationError');
      });
    });
  });

  describe('Permissões', () => {
    it('TC05 — Tentativa de consulta sem autenticação (CT01)', async () => {
      const res = await http().get('/reservations');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });
});
