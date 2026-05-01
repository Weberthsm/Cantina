/**
 * US03 — Cancelamento de reservas (cliente)
 * Casos cobertos: TC01 a TC05 e TC07 (TC06 é camada Web).
 */
const { expect } = require('chai');
const { createClientReady, loginAsAdmin } = require('../../helpers/auth');
const { createReservation, cancelReservation, deliver, getAvailability } = require('../../helpers/reservations');
const { uniqueFutureDate } = require('../../helpers/dates');
const http = require('../../helpers/http');

describe('US03 — Cancelamento de reservas (cliente)', () => {
  describe('Regras de negócio', () => {
    it('TC01 — Cliente cancela reserva própria antes do horário de corte (CT01, CT06, CT07)', async () => {
      const cli = await createClientReady();
      const date = uniqueFutureDate();
      const created = await createReservation(cli.token, { date, mealType: 'jantar', quantity: 2 });
      expect(created.status).to.equal(201);

      const cancel = await cancelReservation(cli.token, created.body.id);
      expect(cancel.status).to.equal(200);
      expect(cancel.body).to.include({ status: 'cancelada' });
      expect(cancel.body).to.have.property('cancelledAt').that.is.a('string');

      // Side effect: estoque liberado (used voltou ao valor anterior à reserva).
      const av = await getAvailability(cli.token, date);
      expect(av.body.jantar.used).to.equal(0);
    });
  });

  describe('Regras de estado e permissão', () => {
    it('TC02 — Cliente tenta cancelar reserva de outro usuário (CT02)', async () => {
      const owner = await createClientReady();
      const other = await createClientReady();
      const date = uniqueFutureDate();
      const created = await createReservation(owner.token, { date, mealType: 'almoco' });
      expect(created.status).to.equal(201);

      const res = await cancelReservation(other.token, created.body.id);
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error', 'Forbidden');
    });

    it('TC04 — Cancelamento de reserva já entregue (CT04)', async () => {
      const cli = await createClientReady();
      const admin = await loginAsAdmin();
      const created = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'jantar',
      });
      expect(created.status).to.equal(201);

      const delivered = await deliver(admin.token, created.body.id);
      expect(delivered.status).to.equal(200);
      expect(delivered.body).to.include({ status: 'entregue' });

      const res = await cancelReservation(cli.token, created.body.id);
      expect(res.status).to.equal(409);
      expect(res.body).to.have.property('error', 'Conflict');
    });

    it('TC05 — Cancelamento de reserva já cancelada (CT05)', async () => {
      const cli = await createClientReady();
      const created = await createReservation(cli.token, {
        date: uniqueFutureDate(),
        mealType: 'almoco',
      });
      expect(created.status).to.equal(201);

      const c1 = await cancelReservation(cli.token, created.body.id);
      expect(c1.status).to.equal(200);

      const c2 = await cancelReservation(cli.token, created.body.id);
      expect(c2.status).to.equal(409);
      expect(c2.body).to.have.property('error', 'Conflict');
    });
  });

  describe('Permissões', () => {
    it('TC07 — Tentativa de cancelar sem autenticação (CT01)', async () => {
      const res = await http().delete('/reservations/algum-id-qualquer');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });

  // TC03 (cancelamento após corte) é dependente de hora atual; depende de
  // configuração específica do CUTOFF_HOUR_*. Documentado no doc de casos.
});
