<script setup>
import { reactive, ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { AuthService } from '@/services/auth.service';
import { useNotificationStore } from '@/stores/notifications';

const router = useRouter();
const notifications = useNotificationStore();
const form = reactive({ email: '' });
const busy = ref(false);

async function submit() {
  busy.value = true;
  try {
    const r = await AuthService.forgotPassword(form.email);
    notifications.success(
      'Se o e-mail existir, um token de recuperação foi enviado.'
    );
    // Em dev a API devolve o token; já encaminhamos para o reset.
    router.push({
      name: 'reset-password',
      query: { token: r?.recoveryToken || '' },
    });
  } catch {
    // interceptor já notifica
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen grid place-items-center px-4 py-12 bg-gradient-to-br from-brand-50 to-slate-50">
    <div class="w-full max-w-md">
      <div class="text-center mb-6">
        <span class="text-4xl">🔑</span>
        <h1 class="mt-2 text-2xl font-bold text-slate-900">Recuperar senha</h1>
        <p class="text-sm text-slate-500">Informe seu e-mail e enviaremos um token de redefinição.</p>
      </div>
      <form class="card p-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="label">E-mail</label>
          <input v-model="form.email" type="email" class="input" required />
        </div>
        <button class="btn-primary w-full" :disabled="busy">
          <span v-if="busy">Enviando…</span>
          <span v-else>Enviar token</span>
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
