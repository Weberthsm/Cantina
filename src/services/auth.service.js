/**
 * Service de autenticação.
 *
 * Regras implementadas:
 * - Cadastro com nome completo, e-mail e senha (mínimo 6 caracteres).
 * - E-mail único e em formato válido.
 * - Senha armazenada com bcrypt.
 * - Confirmação de e-mail antes de permitir login.
 * - Login bloqueado após 5 tentativas inválidas consecutivas.
 * - Recuperação de senha via token enviado por e-mail (simulado, retornado na resposta dev).
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const UserModel = require('../models/user.model');
const AppError = require('../utils/AppError');
const config = require('../config');
const db = require('../database/memoryDB');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration({ name, email, password }) {
  if (!name || !name.trim()) {
    throw new AppError('Nome completo é obrigatório.', 400, 'ValidationError');
  }
  if (!email || !email.trim()) {
    throw new AppError('E-mail é obrigatório.', 400, 'ValidationError');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('E-mail em formato inválido.', 400, 'ValidationError');
  }
  if (!password || password.length < 6) {
    throw new AppError(
      'A senha deve possuir no mínimo 6 caracteres.',
      400,
      'ValidationError'
    );
  }
}

const AuthService = {
  /**
   * Cadastra um novo cliente. Não permite acesso até que o e-mail seja confirmado.
   */
  register({ name, email, password }) {
    validateRegistration({ name, email, password });

    if (UserModel.findByEmail(email)) {
      throw new AppError('E-mail já cadastrado.', 409, 'Conflict');
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = {
      id: uuid(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      cpf: null,
      phone: null,
      address: null,
      passwordHash,
      role: config.roles.CLIENT,
      failedLoginAttempts: 0,
      isBlocked: false,
      isEmailConfirmed: false,
      createdAt: new Date().toISOString(),
    };
    UserModel.create(user);

    const token = uuid();
    db.emailConfirmationTokens[token] = user.id;

    return { user: UserModel.toPublic(user), confirmationToken: token };
  },

  /**
   * Confirma o e-mail usando o token enviado durante o cadastro.
   */
  confirmEmail(token) {
    const userId = db.emailConfirmationTokens[token];
    if (!userId) {
      throw new AppError(
        'Token de confirmação inválido ou expirado.',
        400,
        'ValidationError'
      );
    }
    UserModel.update(userId, { isEmailConfirmed: true });
    delete db.emailConfirmationTokens[token];
    return { confirmed: true };
  },

  /**
   * Realiza login. Bloqueia o usuário após 5 falhas consecutivas.
   */
  login({ email, password }) {
    if (!email || !password) {
      throw new AppError(
        'E-mail e senha são obrigatórios.',
        400,
        'ValidationError'
      );
    }

    const user = UserModel.findByEmail(email);
    if (!user) {
      throw new AppError('Credenciais inválidas.', 401, 'Unauthorized');
    }

    if (user.isBlocked) {
      throw new AppError(
        'Usuário bloqueado por excesso de tentativas. Recupere a senha para desbloquear.',
        423,
        'Locked'
      );
    }

    if (!user.isEmailConfirmed) {
      throw new AppError(
        'E-mail ainda não confirmado. Confirme o cadastro antes de logar.',
        403,
        'Forbidden'
      );
    }

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const patch = { failedLoginAttempts: attempts };
      if (attempts >= config.business.maxFailedLoginAttempts) {
        patch.isBlocked = true;
      }
      UserModel.update(user.id, patch);

      if (patch.isBlocked) {
        throw new AppError(
          'Usuário bloqueado por excesso de tentativas. Recupere a senha para desbloquear.',
          423,
          'Locked'
        );
      }
      throw new AppError('Credenciais inválidas.', 401, 'Unauthorized');
    }

    UserModel.update(user.id, { failedLoginAttempts: 0 });

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token,
      user: UserModel.toPublic({ ...user, failedLoginAttempts: 0 }),
    };
  },

  /**
   * Gera token de recuperação de senha (simula envio por e-mail).
   */
  requestPasswordRecovery(email) {
    const user = UserModel.findByEmail(email);
    // Mesmo que o usuário não exista, retornamos sucesso silencioso para não vazar informação.
    if (!user) {
      return { sent: true };
    }
    const token = uuid();
    db.passwordRecoveryTokens[token] = {
      userId: user.id,
      expiresAt: Date.now() + 1000 * 60 * 30, // 30 minutos
    };
    // Retorna o token em desenvolvimento para facilitar testes.
    return { sent: true, recoveryToken: token };
  },

  /**
   * Reseta a senha utilizando o token de recuperação.
   * Também desbloqueia o usuário e zera tentativas de login.
   */
  resetPassword({ token, newPassword }) {
    const entry = db.passwordRecoveryTokens[token];
    if (!entry || entry.expiresAt < Date.now()) {
      throw new AppError(
        'Token de recuperação inválido ou expirado.',
        400,
        'ValidationError'
      );
    }
    if (!newPassword || newPassword.length < 6) {
      throw new AppError(
        'A nova senha deve possuir no mínimo 6 caracteres.',
        400,
        'ValidationError'
      );
    }
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    UserModel.update(entry.userId, {
      passwordHash,
      failedLoginAttempts: 0,
      isBlocked: false,
    });
    delete db.passwordRecoveryTokens[token];
    return { reset: true };
  },
};

module.exports = AuthService;
