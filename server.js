/**
 * Ponto de entrada da aplicação.
 * Inicia o servidor HTTP utilizando o Express configurado em src/app.js.
 */
require('dotenv').config();

const app = require('./src/app');
const config = require('./src/config');
const { seedAdminUser } = require('./src/database/seed');

// Cria um usuário administrador padrão para facilitar testes iniciais.
seedAdminUser();

app.listen(config.port, () => {
  console.log(`Cantina API rodando em http://localhost:${config.port}`);
  console.log(`Swagger disponível em  http://localhost:${config.port}/api-docs`);
});
