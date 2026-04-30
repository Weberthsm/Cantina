<script setup>
import { reactive, ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { AuthService } from '@/services/auth.service';
import { useNotificationStore } from '@/stores/notifications';

const router = useRouter();
const notifications = useNotificationStore();

const form = reactive({ name: '', email: '', password: '' });
const busy = ref(false);

async function submit() {
  busy.value = true;
  try {
    const result = await AuthService.register(form);
    notifications.success(
      'Cadastro realizado! Confirme seu e-mail para fazer login.'
    );
    // Em ambiente dev a API retorna o token; encaminhamos o usuário direto à página de confirmação.
    router.push({
      name: 'confirm-email',
      query: { token: result.confirmationToken || '' },
    });
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
        <span class="text-4xl">🍱</span>
        <h1 class="mt-2 text-2xl font-bold text-slate-900">Crie sua conta</h1>
        <p class="text-sm text-slate-500">É rápido. Você confirma o e-mail e já pode reservar.</p>
      </div>
      <form class="card p-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="label">Nome completo</label>
          <input v-model="form.name" type="text" class="input" required placeholder="Maria Silva" />
        </div>
        <div>
          <label class="label">E-mail</label>
          <input v-model="form.email" type="email" class="input" required placeholder="maria@email.com" />
        </div>
        <div>
          <label class="label">Senha (mínimo 6 caracteres)</label>
          <input v-model="form.password" type="password" minlength="6" class="input" required />
        </div>
        <button class="btn-primary w-full" :disabled="busy">
          <span v-if="busy">Cadastrando…</span>
          <span v-else>Cadastrar</span>
        </button>
        <p class="text-sm text-center pt-2">
          Já tem conta?
          <RouterLink :to="{ name: 'login' }" class="text-brand-700 hover:underline">Entrar</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
