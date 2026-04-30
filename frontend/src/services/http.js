/**
 * Cliente HTTP central da aplicação.
 *
 * Responsabilidades:
 * - injetar o token JWT em cada requisição autenticada;
 * - normalizar erros vindos da API em uma estrutura consistente;
 * - desencadear logout automático em 401 expirado;
 * - emitir toasts de erro para qualquer status fora de 2xx.
 */
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import router from '@/router';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const http = axios.create({
  baseURL,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const notifications = useNotificationStore();
    const auth = useAuthStore();

    // Erro de rede / timeout
    if (!error.response) {
      notifications.push({
        type: 'error',
        title: 'Falha de conexão',
        message: 'Não foi possível alcançar o servidor. Verifique sua conexão.',
      });
      return Promise.reject({
        status: 0,
        message: 'Falha de conexão.',
        original: error,
      });
    }

    const { status, data } = error.response;
    const apiMessage = data?.message || 'Ocorreu um erro inesperado.';
    const apiError = data?.error || 'Error';

    // Sessão expirada / token inválido
    if (status === 401 && auth.token) {
      auth.logout({ silent: true });
      notifications.push({
        type: 'warning',
        title: 'Sessão expirada',
        message: 'Faça login novamente para continuar.',
      });
      router.push({ name: 'login' });
    } else {
      notifications.push({
        type: status >= 500 ? 'error' : 'warning',
        title: titleFromStatus(status, apiError),
        message: apiMessage,
      });
    }

    return Promise.reject({
      status,
      error: apiError,
      message: apiMessage,
      details: data?.details,
    });
  }
);

function titleFromStatus(status, fallback) {
  const map = {
    400: 'Dados inválidos',
    401: 'Não autorizado',
    403: 'Acesso negado',
    404: 'Não encontrado',
    409: 'Conflito',
    423: 'Conta bloqueada',
    500: 'Erro no servidor',
  };
  return map[status] || fallback || 'Erro';
}

export default http;
