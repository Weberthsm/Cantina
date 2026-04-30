/**
 * Service de usuário.
 * Responsável por consultar e completar dados do perfil
 * (nome, cpf, endereço, telefone) exigidos para reservar.
 */
const UserModel = require('../models/user.model');
const AppError = require('../utils/AppError');

const CPF_REGEX = /^\d{11}$/;

const UserService = {
  getProfile(userId) {
    const user = UserModel.findById(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404, 'NotFound');
    }
    return UserModel.toPublic(user);
  },

  /**
   * Atualiza dados de cadastro do próprio usuário.
   * Garante que CPF, telefone e endereço sejam coletados antes de reservar.
   */
  updateProfile(userId, { name, cpf, phone, address }) {
    const user = UserModel.findById(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404, 'NotFound');
    }

    const patch = {};
    if (name !== undefined) {
      if (!name || !name.trim()) {
        throw new AppError('Nome não pode ser vazio.', 400, 'ValidationError');
      }
      patch.name = name.trim();
    }
    if (cpf !== undefined) {
      const onlyDigits = String(cpf).replace(/\D/g, '');
      if (!CPF_REGEX.test(onlyDigits)) {
        throw new AppError(
          'CPF inválido. Informe 11 dígitos.',
          400,
          'ValidationError'
        );
      }
      patch.cpf = onlyDigits;
    }
    if (phone !== undefined) {
      if (!phone || String(phone).replace(/\D/g, '').length < 10) {
        throw new AppError(
          'Telefone inválido. Informe ao menos 10 dígitos.',
          400,
          'ValidationError'
        );
      }
      patch.phone = String(phone).trim();
    }
    if (address !== undefined) {
      if (!address || !address.trim()) {
        throw new AppError('Endereço inválido.', 400, 'ValidationError');
      }
      patch.address = address.trim();
    }

    const updated = UserModel.update(userId, patch);
    return UserModel.toPublic(updated);
  },
};

module.exports = UserService;
