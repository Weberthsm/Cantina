/**
 * Configuração do Vue Router com guards de autenticação e perfil admin.
 */
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true, hideIfAuth: true },
  },
  {
    path: '/cadastro',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { public: true, hideIfAuth: true },
  },
  {
    path: '/confirmar-email',
    name: 'confirm-email',
    component: () => import('@/views/ConfirmEmailView.vue'),
    meta: { public: true },
  },
  {
    path: '/recuperar-senha',
    name: 'forgot-password',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { public: true, hideIfAuth: true },
  },
  {
    path: '/redefinir-senha',
    name: 'reset-password',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
  },
  {
    path: '/reservas',
    name: 'reservations',
    component: () => import('@/views/ReservationsView.vue'),
  },
  {
    path: '/reservas/nova',
    name: 'reservations.new',
    component: () => import('@/views/NewReservationView.vue'),
  },
  {
    path: '/perfil',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { adminOnly: true },
  },
  { path: '/:pathMatch(.*)*', redirect: { name: 'dashboard' } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.public) {
    if (to.meta.hideIfAuth && auth.isAuthenticated) {
      return { name: 'dashboard' };
    }
    return true;
  }

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.adminOnly && !auth.isAdmin) {
    return { name: 'dashboard' };
  }
  return true;
});

export default router;
