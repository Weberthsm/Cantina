/**
 * Acesso à coleção de usuários no banco em memória.
 */
const db = require('../database/memoryDB');

const UserModel = {
  findAll() {
    return db.users;
  },

  findById(id) {
    return db.users.find((u) => u.id === id) || null;
  },

  findByEmail(email) {
    if (!email) return null;
    return (
      db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      null
    );
  },

  create(user) {
    db.users.push(user);
    return user;
  },

  update(id, patch) {
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...patch };
    return db.users[idx];
  },

  /**
   * Retorna uma cópia segura do usuário, sem o hash de senha.
   */
  toPublic(user) {
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
  },
};

module.exports = UserModel;
