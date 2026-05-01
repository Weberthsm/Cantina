/**
 * US10 — Gerenciamento do próprio perfil
 * Casos cobertos: TC01 a TC06, TC08 (TC07 é camada Web).
 */
const { expect } = require('chai');
const { registerAndConfirm, loginAs, completeProfile } = require('../../helpers/auth');
const fixtures = require('../../fixtures/invalid-payloads.json');
const http = require('../../helpers/http');

describe('US10 — Gerenciamento do próprio perfil', () => {
  describe('Regras de negócio', () => {
    it('TC01 — Cliente atualiza perfil com dados válidos (CT02)', async () => {
      const creds = await registerAndConfirm();
      const login = await loginAs(creds.email, creds.password);

      const updated = await completeProfile(login.token, {
        cpf: '11122233344',
        phone: '11999998888',
        address: 'Av. Paulista, 1000',
      });
      expect(updated).to.include({
        cpf: '11122233344',
        phone: '11999998888',
        address: 'Av. Paulista, 1000',
      });
    });

    it('TC02 — Cliente consulta seu próprio perfil (CT01)', async () => {
      const creds = await registerAndConfirm();
      const login = await loginAs(creds.email, creds.password);

      const res = await http().get('/users/me').set('Authorization', `Bearer ${login.token}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ email: creds.email, role: 'client' });
    });

    it('TC06 — Senha (hash) nunca aparece na resposta de perfil (CT06)', async () => {
      const creds = await registerAndConfirm();
      const login = await loginAs(creds.email, creds.password);

      const res = await http().get('/users/me').set('Authorization', `Bearer ${login.token}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.not.have.property('passwordHash');
      expect(res.body).to.not.have.property('password');
    });
  });

  describe('Validações', () => {
    fixtures.us10_cpf_invalido.forEach(({ description, cpf }) => {
      it(`TC03 — Atualização com CPF inválido [${description}] (CT03)`, async () => {
        const creds = await registerAndConfirm();
        const login = await loginAs(creds.email, creds.password);

        const res = await http()
          .patch('/users/me')
          .set('Authorization', `Bearer ${login.token}`)
          .send({ cpf });
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('error', 'ValidationError');
      });
    });

    it('TC04 — Atualização com telefone inválido (CT04)', async () => {
      const creds = await registerAndConfirm();
      const login = await loginAs(creds.email, creds.password);

      const res = await http()
        .patch('/users/me')
        .set('Authorization', `Bearer ${login.token}`)
        .send({ phone: '12345' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'ValidationError');
    });

    it('TC05 — Atualização com endereço em branco (CT05)', async () => {
      const creds = await registerAndConfirm();
      const login = await loginAs(creds.email, creds.password);

      const res = await http()
        .patch('/users/me')
        .set('Authorization', `Bearer ${login.token}`)
        .send({ address: '   ' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'ValidationError');
    });
  });

  describe('Permissões', () => {
    it('TC08 — Tentativa de leitura do perfil sem autenticação (CT01)', async () => {
      const res = await http().get('/users/me');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });
});
