/**
 * Wrapper sobre os endpoints de /auth.
 */
import http from './http';

export const AuthService = {
  register(payload) {
    return http.post('/auth/register', payload).then((r) => r.data);
  },
  login(payload) {
    return http.post('/auth/login', payload).then((r) => r.data);
  },
  confirmEmail(token) {
    return http.get(`/auth/confirm-email/${token}`).then((r) => r.data);
  },
  forgotPassword(email) {
    return http.post('/auth/forgot-password', { email }).then((r) => r.data);
  },
  resetPassword(payload) {
    return http.post('/auth/reset-password', payload).then((r) => r.data);
  },
};
