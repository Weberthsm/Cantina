const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/** Reseta o banco em memória e reaplica o seed via endpoint de teste. */
export async function resetApp(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/test/reset`, { method: 'POST' });
  if (res.status === 404) {
    throw new Error(
      'resetApp: POST /test/reset retornou 404.\n' +
      'A API precisa estar rodando com NODE_ENV=test.\n' +
      'Encerre o servidor que está na porta 3000 (ex: o que subiu pelo VS Code) e rode "npm run e2e" novamente.'
    );
  }
  if (!res.ok) {
    throw new Error(`resetApp falhou: ${res.status} ${await res.text()}`);
  }
}

/** Retorna amanhã no formato YYYY-MM-DD. */
export function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Retorna um email único com timestamp para evitar conflitos entre testes. */
export function uniqueEmail(): string {
  return `test_${Date.now()}@cantina.test`;
}

/** Faz login via API e retorna o token JWT (sem passar pela UI). */
export async function loginViaAPI(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`loginViaAPI falhou: ${res.status}`);
  }
  const data = await res.json();
  return data.token as string;
}

/** Registra usuário via API e retorna o token de confirmação de email. */
export async function registerViaAPI(name: string, email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    throw new Error(`registerViaAPI falhou: ${res.status}`);
  }
  const data = await res.json();
  return data.confirmationToken as string;
}

/** Confirma email via API. */
export async function confirmEmailViaAPI(token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/confirm-email/${token}`);
  if (!res.ok) {
    throw new Error(`confirmEmailViaAPI falhou: ${res.status}`);
  }
}

/** Cria uma reserva via API e retorna o id. */
export async function createReservationViaAPI(
  token: string,
  date: string,
  mealType: 'almoco' | 'jantar',
  quantity = 1
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ date, mealType, quantity }),
  });
  if (!res.ok) {
    throw new Error(`createReservationViaAPI falhou: ${res.status}`);
  }
  const data = await res.json();
  // A API retorna a reserva diretamente: { id, date, mealType, ... }
  return (data.id ?? data.reservation?.id) as string;
}

/** Atualiza perfil do usuário via API. */
export async function updateProfileViaAPI(
  token: string,
  payload: { name?: string; cpf?: string; phone?: string; address?: string }
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`updateProfileViaAPI falhou: ${res.status}`);
  }
}
