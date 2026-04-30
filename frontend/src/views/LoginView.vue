<script setup>
import { ref, reactive } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';

const auth = useAuthStore();
const notifications = useNotificationStore();
const router = useRouter();

const form = reactive({ email: '', password: '' });
const busy = ref(false);

async function submit() {
  busy.value = true;
  try {
    await auth.login(form.email, form.password);
    notifications.success(`Bem-vindo, ${auth.user?.name}!`);
    router.push({ name: 'dashboard' });
  } catch {
    // erros já tratados no interceptor
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen grid place-items-center px-4 py-12 bg-gradient-to-br from-brand-50 to-slate-50">
    <div class="w-full max-w-md">
      <div class="text-center mb-6">
        <span class="text-4xl">🍱</span>
        <h1 class="mt-2 text-2xl font-bold text-slate-900">Cantina</h1>
        <p class="text-sm text-slate-500">Reserve sua marmita com tranquilidade.</p>
      </div>
      <form class="card p-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="label">E-mail</label>
          <input
            v-model="form.email"
            type="email"
            class="input"
            autocomplete="username"
            required
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label class="label">Senha</label>
          <input
            v-model="form.password"
            type="password"
            class="input"
            autocomplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>
        <button class="btn-primary w-full" :disabled="busy">
          <span v-if="busy">Entrando…</span>
          <span v-else>Entrar</span>
        </button>
        <div class="flex justify-between text-sm pt-2">
          <RouterLink :to="{ name: 'forgot-password' }" class="text-brand-700 hover:underline">
            Esqueci minha senha
          </RouterLink>
          <RouterLink :to="{ name: 'register' }" class="text-brand-700 hover:underline">
            Criar conta
          </RouterLink>
        </div>
      </form>
      <p class="text-xs text-center text-slate-500 mt-4">
        Conta de teste: <span class="font-mono">cliente@cantina.com / Cliente@123</span>
      </p>
    </div>
  </div>
</template>
