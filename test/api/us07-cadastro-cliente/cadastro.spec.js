/**
 * US07 — Cadastro de cliente
 * Casos cobertos: TC01 a TC07 (TC08 é camada Web).
 */
const { expect } = require('chai');
const http = require('../../helpers/http');
const { randomEmail, registerAndConfirm, loginAs } = require('../../helpers/auth');
const fixtures = require('../../fixtures/invalid-payloads.json');

describe('US07 — Cadastro de cliente', () => {
  describe('Regras de negócio', () => {
    it('TC01 — Cadastro válido (CT01, CT02, CT03, CT06)', async () => {
      const email = randomEmail();
      const res = await http()
        .post('/auth/register')
        .send({ name: 'Cliente Novo', email, password: 'senha123' });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.include({ email, role: 'client', isEmailConfirmed: false });
      expect(res.body).to.have.property('confirmationToken').that.is.a('string');
      // Senha não retornada
      expect(res.body.user).to.not.have.property('passwordHash');
      expect(res.body.user).to.not.have.property('password');
    });

    it('TC05 — Cadastro com e-mail já utilizado (CT04)', async () => {
      const email = randomEmail();
      const r1 = await http()
        .post('/auth/register')
        .send({ name: 'Primeiro', email, password: 'senha123' });
      expect(r1.status).to.equal(201);
      const r2 = await http()
        .post('/auth/register')
        .send({ name: 'Segundo', email, password: 'outra123' });
      expect(r2.status).to.equal(409);
      expect(r2.body).to.have.property('error', 'Conflict');
    });

    it('TC06 — Senha não é exposta na resposta de cadastro (CT05)', async () => {
      const email = randomEmail();
      const password = 'minhasenha123';
      const res = await http()
        .post('/auth/register')
        .send({ name: 'Privacy', email, password });
      expect(res.status).to.equal(201);
      const json = JSON.stringify(res.body);
      expect(json).to.not.include(password);
    });

    it('TC07 — Login bloqueado para usuário sem confirmação (CT07)', async () => {
      const email = randomEmail();
      const password = 'senha123';
      await http().post('/auth/register').send({ name: 'Sem confirm', email, password });
      const res = await loginAs(email, password);
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error', 'Forbidden');
    });
  });

  describe('Validações', () => {
    fixtures.us07_obrigatorios.forEach(({ description, payload }) => {
      it(`TC02 — Cadastro sem campo obrigatório [${description}] (CT01)`, async () => {
        const res = await http().post('/auth/register').send(payload);
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('error', 'ValidationError');
      });
    });

    fixtures.us07_emails_invalidos.forEach(({ description, email }) => {
      it(`TC03 — Cadastro com e-mail inválido [${description}] (CT02)`, async () => {
        const res = await http()
          .post('/auth/register')
          .send({ name: 'Foo', email, password: 'senha123' });
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('error', 'ValidationError');
      });
    });

    it('TC04 — Cadastro com senha curta (CT03)', async () => {
      const res = await http()
        .post('/auth/register')
        .send({ name: 'Foo', email: randomEmail(), password: '12345' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'ValidationError');
    });
  });
});
