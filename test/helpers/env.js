/**
 * Carregador de variáveis de ambiente para a suíte de testes.
 * Lê TEST_ENV (default "dev") e carrega test/env/.env.<TEST_ENV>.
 * Falha rápido se variáveis obrigatórias não estiverem definidas.
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const TEST_ENV = process.env.TEST_ENV || 'dev';
const envFile = path.resolve(__dirname, '..', 'env', `.env.${TEST_ENV}`);

if (!fs.existsSync(envFile)) {
  console.error(
    `[testes] Arquivo de ambiente "${envFile}" não encontrado.\n` +
      `Copie test/env/.env.example para test/env/.env.${TEST_ENV} e preencha as variáveis.`
  );
  process.exit(1);
}

dotenv.config({ path: envFile });

const required = [
  'BASE_URL',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'CLIENT_EMAIL',
  'CLIENT_PASSWORD',
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    `[testes] Variáveis obrigatórias ausentes em test/env/.env.${TEST_ENV}: ${missing.join(', ')}`
  );
  process.exit(1);
}

console.log(
  `[testes] TEST_ENV=${TEST_ENV} → BASE_URL=${process.env.BASE_URL} (ENV_NAME=${process.env.ENV_NAME || TEST_ENV})`
);
