/**
 * Banco de dados em memória.
 * Armazena coleções como simples arrays/objetos, sem persistência em disco.
 * Reinicia sempre que a aplicação é encerrada.
 */
const db = {
  users: [],
  reservations: [],
  cancellationHistory: [],
  // Estoque por chave "YYYY-MM-DD:mealType". Se não existir, usa o padrão.
  stockOverrides: {},
  // Tokens de confirmação de e-mail e recuperação de senha.
  emailConfirmationTokens: {},
  passwordRecoveryTokens: {},
};

module.exports = db;
