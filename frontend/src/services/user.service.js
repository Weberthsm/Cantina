/**
 * Wrapper sobre /users.
 */
import http from './http';

export const UserService = {
  me() {
    return http.get('/users/me').then((r) => r.data);
  },
  update(payload) {
    return http.patch('/users/me', payload).then((r) => r.data);
  },
};
