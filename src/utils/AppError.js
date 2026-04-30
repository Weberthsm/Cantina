/**
 * Erro de aplicação. Permite indicar status HTTP, código e detalhes.
 * Usado pelos services para retornar mensagens consistentes via middleware.
 */
class AppError extends Error {
  constructor(message, status = 400, errorCode = 'BadRequest', details) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

module.exports = AppError;
