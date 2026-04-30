/**
 * Middleware central de tratamento de erros.
 * Erros lançados nos services são instâncias de AppError com status http definido.
 */
const AppError = require('../utils/AppError');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.errorCode,
      message: err.message,
      details: err.details,
    });
  }

  console.error('Erro inesperado:', err);
  return res
    .status(500)
    .json({ error: 'InternalServerError', message: 'Erro interno do servidor.' });
}

module.exports = errorHandler;
