/**
 * US08 — Confirmação de cadastro por e-mail
 * Casos cobertos: TC01, TC02, TC03 (TC04 é camada Web).
 */
const { expect } = require('chai');
const http = require('../../helpers/http');
const { randomEmail, loginAs } = require('../../helpers/auth');

describe('US08 — Confirmação de cadastro por e-mail', () => {
  describe('Regras de negócio', () => {
    it('TC01 — Confirmação com token válido (CT01)', async () => {
      const email = randomEmail();
      const password = 'senha123';
      const reg = await http()
        .post('/auth/register')
        .send({ name: 'Confirmação OK', email, password });
      expect(reg.status).to.equal(201);
      const token = reg.body.confirmationToken;

      const conf = await http().get(`/auth/confirm-email/${token}`);
      expect(conf.status).to.equal(200);

      // Login deve funcionar agora.
      const login = await loginAs(email, password);
      expect(login.status).to.equal(200);
    });

    it('TC02 — Confirmação com token inválido (CT02)', async () => {
      const res = await http().get('/auth/confirm-email/token-que-nao-existe');
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'ValidationError');
    });

    it('TC03 — Reuso de token já consumido (CT03)', async () => {
      const reg = await http()
        .post('/auth/register')
        .send({ name: 'Reuso', email: randomEmail(), password: 'senha123' });
      const token = reg.body.confirmationToken;

      const c1 = await http().get(`/auth/confirm-email/${token}`);
      expect(c1.status).to.equal(200);

      const c2 = await http().get(`/auth/confirm-email/${token}`);
      expect(c2.status).to.equal(400);
      expect(c2.body).to.have.property('error', 'ValidationError');
    });
  });
});
