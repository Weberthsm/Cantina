<script setup>
import { reactive, ref, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';

const auth = useAuthStore();
const notifications = useNotificationStore();

const form = reactive({ name: '', cpf: '', phone: '', address: '' });
const busy = ref(false);

function fillFromUser() {
  const u = auth.user || {};
  form.name = u.name || '';
  form.cpf = u.cpf || '';
  form.phone = u.phone || '';
  form.address = u.address || '';
}

onMounted(async () => {
  if (!auth.user) await auth.refreshUser();
  fillFromUser();
});

async function submit() {
  busy.value = true;
  try {
    await auth.updateProfile(form);
    notifications.success('Perfil atualizado.');
  } catch {
    // interceptor cuida
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AppLayout>
    <PageHeader
      title="Meu perfil"
      subtitle="Mantenha seus dados atualizados — eles são exigidos para reservas."
    />

    <form class="card p-6 max-w-2xl space-y-5" @submit.prevent="submit">
      <div class="grid sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <label class="label">Nome completo</label>
          <input v-model="form.name" type="text" class="input" required />
        </div>
        <div>
          <label class="label">CPF (somente dígitos)</label>
          <input
            v-model="form.cpf"
            type="text"
            class="input"
            inputmode="numeric"
            maxlength="11"
            placeholder="00000000000"
          />
        </div>
        <div>
          <label class="label">Telefone</label>
          <input
            v-model="form.phone"
            type="tel"
            class="input"
            placeholder="(11) 99999-9999"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="label">Endereço</label>
          <input
            v-model="form.address"
            type="text"
            class="input"
            placeholder="Rua, número, bairro"
          />
        </div>
      </div>

      <div class="border-t border-slate-100 pt-4">
        <p class="text-xs text-slate-500">
          E-mail: <span class="text-slate-700">{{ auth.user?.email }}</span>
          <span v-if="auth.user?.role === 'admin'" class="ml-2 badge bg-brand-100 text-brand-700">Admin</span>
        </p>
      </div>

      <div class="flex justify-end">
        <button class="btn-primary" :disabled="busy">
          <span v-if="busy">Salvando…</span>
          <span v-else>Salvar alterações</span>
        </button>
      </div>
    </form>
  </AppLayout>
</template>
