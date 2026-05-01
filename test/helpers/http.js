/**
 * Wrapper sobre supertest com baseURL do ambiente atual.
 * Cada chamada cria uma nova instância de request para isolamento entre testes.
 */
const request = require('supertest');

function http() {
  return request(process.env.BASE_URL);
}

module.exports = http;
