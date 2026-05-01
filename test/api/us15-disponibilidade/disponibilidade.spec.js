/**
 * US15 — Consultar disponibilidade de marmitas
 * Casos cobertos: TC01 a TC07 (TC08 e TC09 sao camada Web).
 */
const { expect } = require('chai');
const { createClientReady, loginAsAdmin } = require('../../helpers/auth');
const {
  createReservation,
  cancelReservation,
  deliver,
  getAvailability,
} = require('../../helpers/reservations');
const { uniqueFutureDate } = require('../../helpers/dates');
const fixtures = require('../../fixtures/invalid-payloads.json');
const http = require('../../helpers/http');

describe('US15 — Consultar disponibilidade de marmitas', () => {
  describe('Regras de negócio', () => {
    it('TC01 — Consulta em dia sem reservas (CT03)', async () => {
      const cli = await createClientReady();
      const date = uniqueFutureDate();
      const res = await getAvailability(cli.token, date);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('date', date);
      ['almoco', 'jantar'].forEach((meal) => {
        expect(res.body[meal]).to.include.keys('stock', 'used', 'available', 'cutoffHour');
        expect(res.body[meal].used).to.equal(0);
        expect(res.body[meal].available).to.equal(res.body[meal].stock);
      });
    });

    it('TC02 — Consulta após reservas serem feitas reflete soma de quantidades (CT05)', async () => {
      const cli = await createClientReady();
      const date = uniqueFutureDate();
      const r = await createReservation(cli.token, { date, mealType: 'almoco', quantity: 4 });
      expect(r.status).to.equal(201);

      const res = await getAvailability(cli.token, date);
      expect(res.status).to.equal(200);
      expect(res.body.almoco.used).to.equal(4);
      expect(res.body.almoco.available).to.equal(res.body.almoco.stock - 4);
    });

    it('TC03 — Reservas canceladas não consomem o estoque exibido (CT04)', async () => {
      const cli = await createClientReady();
      const date = uniqueFutureDate();
      const r = await createReservation(cli.token, { date, mealType: 'almoco', quantity: 3 });
      await cancelReservation(cli.token, r.body.id);

      const res = await getAvailability(cli.token, date);
      expect(res.status).to.equal(200);
      expect(res.body.almoco.used).to.equal(0);
    });

    it('TC04 — Reservas entregues não consomem o estoque exibido (CT04)', async () => {
      const cli = await createClientReady();
      const admin = await loginAsAdmin();
      const date = uniqueFutureDate();
      const r = await createReservation(cli.token, { date, mealType: 'jantar', quantity: 2 });
      await deliver(admin.token, r.body.id);

      const res = await getAvailability(cli.token, date);
      expect(res.status).to.equal(200);
      expect(res.body.jantar.used).to.equal(0);
    });

    it('TC05 — Refeição esgotada exibe available=0 (CT06)', async function () {
      // Requer estoque baixo o suficiente para um único cliente esgotar via quantity.
      // Espera-se DEFAULT_DAILY_STOCK_JANTAR=5 (igual ao limite por usuário).
      // Caso o estoque seja maior que 5, pula com mensagem orientadora.
      const cli = await createClientReady();
      const date = uniqueFutureDate();
      const av = await getAvailability(cli.token, date);
      const stock = av.body.jantar.stock;
      if (stock > 5) {
        console.log(
          '[testes] TC05 (US15) ignorado: configure DEFAULT_DAILY_STOCK_JANTAR=5 (ou menor) na API.'
        );
        this.skip();
        return;
      }
      const r = await createReservation(cli.token, { date, mealType: 'jantar', quantity: stock });
      expect(r.status).to.equal(201);
      const after = await getAvailability(cli.token, date);
      expect(after.body.jantar.available).to.equal(0);
      expect(after.body.jantar.used).to.equal(stock);
    });
  });

  describe('Validações', () => {
    fixtures.us15_data_invalida.forEach((dataInvalida) => {
      it(`TC06 — Data em formato inválido [${dataInvalida}] (CT02)`, async () => {
        const cli = await createClientReady();
        const res = await http()
          .get('/reservations/availability')
          .set('Authorization', `Bearer ${cli.token}`)
          .query({ date: dataInvalida });
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('error', 'ValidationError');
      });
    });
  });

  describe('Permissões', () => {
    it('TC07 — Tentativa sem autenticação (CT01)', async () => {
      const res = await http().get('/reservations/availability').query({ date: uniqueFutureDate() });
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });
});
