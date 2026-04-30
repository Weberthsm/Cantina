<script setup>
import { onMounted, ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { useAuthStore } from '@/stores/auth';
import { ReservationService } from '@/services/reservation.service';

const auth = useAuthStore();
const items = ref([]);
const loading = ref(true);

const today = new Date().toISOString().slice(0, 10);

const stats = computed(() => {
  const ativas = items.value.filter((r) => r.status === 'ativa').length;
  const futuras = items.value.filter(
    (r) => r.status === 'ativa' && r.date >= today
  ).length;
  const entregues = items.value.filter((r) => r.status === 'entregue').length;
  return { ativas, futuras, entregues };
});

const upcoming = computed(() =>
  items.value
    .filter((r) => r.status === 'ativa' && r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)
);

onMounted(async () => {
  try {
    items.value = await ReservationService.list();
  } finally {
    loading.value = false;
  }
});

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
</script>

<template>
  <AppLayout>
    <PageHeader
      :title="`Olá, ${auth.user?.name?.split(' ')[0] || 'cliente'} 👋`"
      subtitle="Veja sua agenda de marmitas e crie novas reservas."
    >
      <template #actions>
        <RouterLink :to="{ name: 'reservations.new' }" class="btn-primary">
          + Nova reserva
        </RouterLink>
      </template>
    </PageHeader>

    <div v-if="!auth.profileComplete" class="card p-4 mb-6 bg-amber-50 border-amber-200">
      <p class="text-sm text-amber-800">
        Para criar reservas, complete seu perfil (CPF, telefone e endereço).
        <RouterLink :to="{ name: 'profile' }" class="font-medium underline">
          Completar perfil agora
        </RouterLink>
      </p>
    </div>

    <section class="grid sm:grid-cols-3 gap-4 mb-8">
      <div class="card p-5">
        <p class="text-xs uppercase text-slate-500 tracking-wide">Reservas ativas</p>
        <p class="text-3xl font-bold text-slate-900 mt-1">{{ stats.ativas }}</p>
      </div>
      <div class="card p-5">
        <p class="text-xs uppercase text-slate-500 tracking-wide">Refeições futuras</p>
        <p class="text-3xl font-bold text-brand-600 mt-1">{{ stats.futuras }}</p>
      </div>
      <div class="card p-5">
        <p class="text-xs uppercase text-slate-500 tracking-wide">Já entregues</p>
        <p class="text-3xl font-bold text-sky-600 mt-1">{{ stats.entregues }}</p>
      </div>
    </section>

    <section class="card p-5">
      <header class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-slate-900">Próximas reservas</h2>
        <RouterLink
          :to="{ name: 'reservations' }"
          class="text-sm text-brand-700 hover:underline"
        >
          Ver todas →
        </RouterLink>
      </header>

      <div v-if="loading" class="text-slate-500 text-sm">Carregando…</div>
      <div v-else-if="upcoming.length === 0" class="text-slate-500 text-sm">
        Nenhuma reserva futura. Que tal
        <RouterLink :to="{ name: 'reservations.new' }" class="text-brand-700 hover:underline">
          criar uma agora
        </RouterLink>?
      </div>
      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="r in upcoming"
          :key="r.id"
          class="py-3 flex items-center justify-between gap-3"
        >
          <div>
            <p class="font-medium text-slate-900">
              {{ fmtDate(r.date) }} •
              <span class="capitalize">{{ r.mealType }}</span>
            </p>
            <p class="text-xs text-slate-500">ID {{ r.id.slice(0, 8) }}…</p>
          </div>
          <StatusBadge :status="r.status" />
        </li>
      </ul>
    </section>
  </AppLayout>
</template>
