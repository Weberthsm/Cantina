<script setup>
import { ref, reactive, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import ReservationCard from '@/components/ReservationCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { ReservationService } from '@/services/reservation.service';
import { useNotificationStore } from '@/stores/notifications';

const notifications = useNotificationStore();
const filters = reactive({ from: '', to: '' });
const items = ref([]);
const loading = ref(true);

const dialog = reactive({ open: false, reservation: null, busy: false });

async function load() {
  loading.value = true;
  try {
    items.value = await ReservationService.list({
      from: filters.from || undefined,
      to: filters.to || undefined,
    });
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function openCancel(reservation) {
  dialog.reservation = reservation;
  dialog.open = true;
}

async function confirmCancel() {
  if (!dialog.reservation) return;
  dialog.busy = true;
  try {
    await ReservationService.cancel(dialog.reservation.id);
    notifications.success('Reserva cancelada com sucesso.');
    dialog.open = false;
    await load();
  } catch {
    // interceptor cuida
  } finally {
    dialog.busy = false;
  }
}
</script>

<template>
  <AppLayout>
    <PageHeader
      title="Minhas reservas"
      subtitle="Acompanhe o status, filtre por data e cancele quando necessário."
    >
      <template #actions>
        <RouterLink :to="{ name: 'reservations.new' }" class="btn-primary">
          + Nova reserva
        </RouterLink>
      </template>
    </PageHeader>

    <form
      class="card p-4 mb-6 grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end"
      @submit.prevent="load"
    >
      <div>
        <label class="label">De</label>
        <input v-model="filters.from" type="date" class="input" />
      </div>
      <div>
        <label class="label">Até</label>
        <input v-model="filters.to" type="date" class="input" />
      </div>
      <button class="btn-primary" :disabled="loading">Filtrar</button>
      <button
        type="button"
        class="btn-secondary"
        :disabled="loading"
        @click="filters.from = ''; filters.to = ''; load()"
      >
        Limpar
      </button>
    </form>

    <div v-if="loading" class="text-slate-500">Carregando reservas…</div>
    <EmptyState
      v-else-if="items.length === 0"
      title="Nenhuma reserva encontrada"
      message="Crie sua primeira reserva para garantir sua marmita."
      icon="🍽️"
    >
      <RouterLink :to="{ name: 'reservations.new' }" class="btn-primary">
        Criar reserva
      </RouterLink>
    </EmptyState>
    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ReservationCard
        v-for="r in items"
        :key="r.id"
        :reservation="r"
        @cancel="openCancel"
      />
    </div>

    <ConfirmDialog
      v-model="dialog.open"
      title="Cancelar reserva?"
      :message="
        dialog.reservation
          ? `Deseja realmente cancelar a reserva de ${dialog.reservation.mealType} em ${dialog.reservation.date}?`
          : ''
      "
      confirm-text="Sim, cancelar"
      cancel-text="Voltar"
      variant="danger"
      :busy="dialog.busy"
      @confirm="confirmCancel"
    />
  </AppLayout>
</template>
