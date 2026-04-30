<script setup>
import { ref } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { AuthService } from '@/services/auth.service';
import { useNotificationStore } from '@/stores/notifications';

const route = useRoute();
const router = useRouter();
const notifications = useNotificationStore();

const token = ref(route.query.token || '');
const busy = ref(false);
const confirmed = ref(false);

async function submit() {
  if (!token.value) return;
  busy.value = true;
  try {
    await AuthService.confirmEmail(token.value);
    confirmed.value = true;
    notifications.success('E-mail confirmado! Faça login para continuar.');
    setTimeout(() => router.push({ name: 'login' }), 1500);
  } catch {
    // tratado no interceptor
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen grid place-items-center px-4 py-12 bg-gradient-to-br from-brand-50 to-slate-50">
    <div class="w-full max-w-md">
      <div class="text-center mb-6">
        <span class="text-4xl">📧</span>
        <h1 class="mt-2 text-2xl font-bold text-slate-900">Confirme seu e-mail</h1>
        <p class="text-sm text-slate-500">
          Cole abaixo o token recebido após o cadastro (em desenvolvimento, ele aparece na resposta da API).
        </p>
      </div>
      <form class="card p-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="label">Token de confirmação</label>
          <input v-model="token" type="text" class="input font-mono" required />
        </div>
        <button class="btn-primary w-full" :disabled="busy || confirmed">
          <span v-if="confirmed">Confirmado!</span>
          <span v-else-if="busy">Confirmando…</span>
          <span v-else>Confirmar e-mail</span>
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
