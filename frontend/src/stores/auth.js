/**
 * Store de autenticação. Mantém token + usuário em memória e em localStorage.
 */
import { defineStore } from 'pinia';
import { AuthService } from '@/services/auth.service';
import { UserService } from '@/services/user.service';
import { useNotificationStore } from '@/stores/notifications';

const STORAGE_KEY = 'cantina.auth';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const persisted = loadFromStorage();
    return {
      token: persisted?.token || null,
      user: persisted?.user || null,
    };
  },
  getters: {
    isAuthenticated: (s) => Boolean(s.token),
    isAdmin: (s) => s.user?.role === 'admin',
    profileComplete: (s) => {
      const u = s.user;
      return Boolean(u && u.name && u.cpf && u.phone && u.address);
    },
  },
  actions: {
    persist() {
      if (this.token && this.user) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ token: this.token, user: this.user })
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    async login(email, password) {
      const data = await AuthService.login({ email, password });
      this.token = data.token;
      this.user = data.user;
      this.persist();
      return data;
    },
    logout({ silent = false } = {}) {
      this.token = null;
      this.user = null;
      this.persist();
      if (!silent) {
        const notifications = useNotificationStore();
        notifications.push({
          type: 'info',
          title: 'Sessão encerrada',
          message: 'Você saiu da sua conta.',
        });
      }
    },
    async refreshUser() {
      if (!this.token) return null;
      const me = await UserService.me();
      this.user = me;
      this.persist();
      return me;
    },
    async updateProfile(payload) {
      const me = await UserService.update(payload);
      this.user = me;
      this.persist();
      return me;
    },
  },
});
