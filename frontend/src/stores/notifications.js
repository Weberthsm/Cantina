/**
 * Store de notificações (toasts).
 * Usada por views, services e o interceptor de axios.
 */
import { defineStore } from 'pinia';

let nextId = 1;

export const useNotificationStore = defineStore('notifications', {
  state: () => ({ items: [] }),
  actions: {
    push({ type = 'info', title, message, timeout = 5000 }) {
      const id = nextId++;
      this.items.push({ id, type, title, message });
      if (timeout > 0) {
        setTimeout(() => this.dismiss(id), timeout);
      }
      return id;
    },
    success(message, title = 'Sucesso') {
      return this.push({ type: 'success', title, message });
    },
    info(message, title = 'Aviso') {
      return this.push({ type: 'info', title, message });
    },
    error(message, title = 'Erro') {
      return this.push({ type: 'error', title, message });
    },
    dismiss(id) {
      this.items = this.items.filter((n) => n.id !== id);
    },
    clear() {
      this.items = [];
    },
  },
});
