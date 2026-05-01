/**
 * US14 — Documentação interativa da API
 * Casos cobertos: TC01 a TC04.
 */
const { expect } = require('chai');
const http = require('../../helpers/http');

describe('US14 — Documentação interativa da API', () => {
  describe('Regras de negócio', () => {
    it('TC01 — Especificação carregada na inicialização (CT01)', async () => {
      // Se a API subiu sem erro e os endpoints respondem, o spec foi carregado.
      const res = await http().get('/');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('docs', '/api-docs');
    });

    it('TC02 — UI Swagger acessível (CT02)', async () => {
      const res = await http().get('/api-docs/');
      expect(res.status).to.equal(200);
      expect(res.text).to.include('Swagger UI');
    });

    it('TC03 — Documento OpenAPI cru disponível (CT03)', async () => {
      const res = await http().get('/api-docs.json');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('openapi');
      expect(res.body).to.have.property('paths');
    });

    it('TC04 — Documentação contempla códigos de erro previstos (CT04)', async () => {
      const res = await http().get('/api-docs.json');
      expect(res.status).to.equal(200);
      const responses = res.body.components && res.body.components.responses;
      expect(responses).to.be.an('object');
      // Espera referências para os principais códigos.
      ['BadRequest', 'Unauthorized', 'Forbidden', 'NotFound', 'Conflict', 'Locked', 'InternalServerError'].forEach(
        (key) => {
          expect(responses).to.have.property(key);
        }
      );
    });
  });
});
