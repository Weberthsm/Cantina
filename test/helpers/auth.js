/**
 * Helpers de autenticação:
 *  - loginAs: faz login e devolve { token, user, response }
 *  - registerAndConfirm: cadastra usuário, confirma o e-mail e devolve credenciais
 *    (usado para cenários que precisam de um usuário "limpo" para não interferir nos demais)
 *  - completeProfile: preenche cpf/telefone/endereço para que o usuário possa reservar
 *  - randomEmail: gera um e-mail único para isolamento entre testes
 */
const http = require('./http');

function randomEmail(prefix = 'e2e') {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${suffix}@cantina.test`;
}

async function loginAs(email, password) {
  const res = await http().post('/auth/login').send({ email, password });
  return { status: res.status, token: res.body && res.body.token, user: res.body && res.body.user, body: res.body };
}

async function loginAsAdmin() {
  return loginAs(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
}

async function loginAsClient() {
  return loginAs(process.env.CLIENT_EMAIL, process.env.CLIENT_PASSWORD);
}

async function registerAndConfirm({ name = 'Test User', password = 'senha123', email } = {}) {
  const userEmail = email || randomEmail();
  const reg = await http().post('/auth/register').send({ name, email: userEmail, password });
  const token = reg.body && reg.body.confirmationToken;
  if (!token) {
    throw new Error(`Falha no registro de ${userEmail}: ${reg.status} ${JSON.stringify(reg.body)}`);
  }
  await http().get(`/auth/confirm-email/${token}`);
  return { email: userEmail, password, name };
}

async function completeProfile(token, overrides = {}) {
  const profile = {
    cpf: overrides.cpf || '12345678900',
    phone: overrides.phone || '11999998888',
    address: overrides.address || 'Rua Teste, 100',
    ...overrides,
  };
  const res = await http()
    .patch('/users/me')
    .set('Authorization', `Bearer ${token}`)
    .send(profile);
  return res.body;
}

/**
 * Cria um usuário cliente novo, confirmado e com perfil completo.
 * Útil para isolar testes que precisam de "estado zero" do usuário.
 */
async function createClientReady() {
  const creds = await registerAndConfirm();
  const login = await loginAs(creds.email, creds.password);
  await completeProfile(login.token);
  return { ...creds, token: login.token, user: login.user };
}

module.exports = {
  loginAs,
  loginAsAdmin,
  loginAsClient,
  registerAndConfirm,
  completeProfile,
  createClientReady,
  randomEmail,
};
