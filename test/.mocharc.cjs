/**
 * Configuração do Mocha.
 * O require de `helpers/env.js` garante que o ambiente certo é carregado
 * antes de qualquer spec rodar (TEST_ENV → test/env/.env.<env>).
 */
module.exports = {
  require: ['test/helpers/env.js'],
  recursive: true,
  timeout: 15000,
  reporter: 'spec',
  bail: false,
};
