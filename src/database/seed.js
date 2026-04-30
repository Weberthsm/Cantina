/**
 * Popula o banco em memória com dados iniciais para facilitar testes.
 * Cria um administrador e um cliente exemplo já confirmados.
 */
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const db = require('./memoryDB');
const config = require('../config');

function seedAdminUser() {
  if (db.users.length > 0) return;

  const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);
  const clientPasswordHash = bcrypt.hashSync('Cliente@123', 10);

  db.users.push({
    id: uuid(),
    name: 'Administrador',
    email: 'admin@cantina.com',
    cpf: '00000000000',
    phone: '00000000000',
    address: 'Sede Cantina',
    passwordHash: adminPasswordHash,
    role: config.roles.ADMIN,
    failedLoginAttempts: 0,
    isBlocked: false,
    isEmailConfirmed: true,
    createdAt: new Date().toISOString(),
  });

  db.users.push({
    id: uuid(),
    name: 'Cliente Exemplo',
    email: 'cliente@cantina.com',
    cpf: '11111111111',
    phone: '11999999999',
    address: 'Rua Exemplo, 123',
    passwordHash: clientPasswordHash,
    role: config.roles.CLIENT,
    failedLoginAttempts: 0,
    isBlocked: false,
    isEmailConfirmed: true,
    createdAt: new Date().toISOString(),
  });

  console.log('Usuários iniciais criados:');
  console.log('  - admin@cantina.com   / Admin@123');
  console.log('  - cliente@cantina.com / Cliente@123');
}

module.exports = { seedAdminUser };
