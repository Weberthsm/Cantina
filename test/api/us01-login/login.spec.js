/**
 * US01 — Login de usuário
 * Casos de teste cobertos: TC01 a TC08 (TC09 e TC10 são camada Web).
 */
const { expect } = require('chai');
const http = require('../../helpers/http');
const { loginAs, loginAsClient, registerAndConfirm, randomEmail } = require('../../helpers/auth');
const fixtures = require('../../fixtures/invalid-payloads.json');

describe('US01 — Login de usuário', () => {
  describe('Regras de negócio', () => {
    it('TC01 — Cliente autentica com sucesso (CT02)', async () => {
      const res = await loginAsClient();
      expect(res.status).to.equal(200);
      expect(res.token).to.be.a('string').and.not.empty;
      expect(res.user).to.have.property('email', process.env.CLIENT_EMAIL);
      expect(res.user).to.not.have.property('passwordHash');
    });

    it('TC03 — Login com senha incorreta (CT03)', async () => {
      const res = await loginAs(process.env.CLIENT_EMAIL, 'senha-errada-123');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('TC04 — Login com e-mail não cadastrado (CT03)', async () => {
      const res = await loginAs(`nao-existe-${Date.now()}@cantina.test`, 'qualquer123');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('TC05 — Bloqueio após 5 tentativas inválidas consecutivas (@destructive) (CT04)', async () => {
      // Cria um usuário novo só para esse teste, para não bloquear o cliente do seed.
      const creds = await registerAndConfirm();
      for (let i = 0; i < 5; i++) {
        const r = await loginAs(creds.email, 'errada');
        expect(r.status).to.be.oneOf([401, 423]);
      }
      // A 6ª tentativa (mesmo com senha correta) já deve estar bloqueada.
      const blocked = await loginAs(creds.email, creds.password);
      expect(blocked.status).to.equal(423);
      expect(blocked.body).to.have.property('error', 'Locked');
    });

    it('TC06 — Login bloqueado para usuário com bloqueio ativo (CT06)', async () => {
      const creds = await registerAndConfirm();
      // Provoca o bloqueio.
      for (let i = 0; i < 5; i++) {
        await loginAs(creds.email, 'errada');
      }
      const res = await loginAs(creds.email, creds.password);
      expect(res.status).to.equal(423);
      expect(res.body).to.have.property('error', 'Locked');
    });

    it('TC07 — Login bloqueado para usuário com e-mail não confirmado (CT05)', async () => {
      const email = randomEmail();
      // Apenas registra, NÃO confirma.
      await http().post('/auth/register').send({ name: 'Sem confirmação', email, password: 'senha123' });
      const res = await loginAs(email, 'senha123');
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error', 'Forbidden');
    });

    it('TC08 — Contador de tentativas zera após login bem-sucedido (CT07)', async () => {
      const creds = await registerAndConfirm();
      // 3 tentativas inválidas (sem chegar nas 5 que bloqueiam).
      for (let i = 0; i < 3; i++) {
        await loginAs(creds.email, 'errada');
      }
      // Login válido.
      const ok = await loginAs(creds.email, creds.password);
      expect(ok.status).to.equal(200);
      // Após login válido, mais 4 tentativas inválidas não devem bloquear (contador zerado).
      for (let i = 0; i < 4; i++) {
        const r = await loginAs(creds.email, 'errada');
        expect(r.status).to.equal(401);
      }
      // Login válido continua funcionando.
      const ok2 = await loginAs(creds.email, creds.password);
      expect(ok2.status).to.equal(200);
    });
  });

  describe('Validações', () => {
    fixtures.us01_login_missing_fields.forEach(({ description, payload }) => {
      it(`TC02 — Login sem campos obrigatórios [${description}] (CT01)`, async () => {
        const res = await http().post('/auth/login').send(payload);
        expect(res.status).to.be.oneOf([400, 401]);
        expect(res.body).to.have.property('error');
      });
    });
  });
});
