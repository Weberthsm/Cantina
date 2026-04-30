<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { AuthService } from '@/services/auth.service';
import { useNotificationStore } from '@/stores/notifications';

const route = useRoute();
const router = useRouter();
const notifications = useNotificationStore();

const form = reactive({
  token: route.query.token || '',
  newPassword: '',
});
const busy = ref(false);

async function submit() {
  busy.value = true;
  try {
    await AuthService.resetPassword(form);
    notifications.success('Senha redefinida! Faça login com a nova senha.');
    router.push({ name: 'login' });
  } catch {
    // interceptor cuida
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen grid place-items-center px-4 py-12 bg-gradient-to-br from-brand-50 to-slate-50">
    <div class="w-full max-w-md">
      <div class="text-center mb-6">
        <span class="text-4xl">🔒</span>
        <h1 class="mt-2 text-2xl font-bold text-slate-900">Redefinir senha</h1>
      </div>
      <form class="card p-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="label">Token de recuperação</label>
          <input v-model="form.token" type="text" class="input font-mono" required />
        </div>
        <div>
          <label class="label">Nova senha (mínimo 6 caracteres)</label>
          <input
            v-model="form.newPassword"
            type="password"
            minlength="6"
            class="input"
            required
          />
        </div>
        <button class="btn-primary w-full" :disabled="busy">
          <span v-if="busy">Atualizando…</span>
          <span v-else>Redefinir senha</span>
        </button>
        <p class="text-sm text-center pt-2">
          <RouterLink :to="{ name: 'login' }" class="text-brand-700 hover:underline">
            Voltar para o login
          </RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
