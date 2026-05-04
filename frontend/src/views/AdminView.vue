<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import ReservationCard from '@/components/ReservationCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { ReservationService } from '@/services/reservation.service';
import { useNotificationStore } from '@/stores/notifications';

const notifications = useNotificationStore();
const filters = reactive({ from: '', to: '', status: 'todas' });
const items = ref([]);
const history = ref([]);
const loading = ref(true);
const tab = ref('reservas');

const deliverDialog = reactive({ open: false, reservation: null, busy: false });
const cancelDialog = reactive({
  open: false,
  reservation: null,
  reason: '',
  busy: false,
});

const filteredItems = computed(() => {
  if (filters.status === 'todas') return items.value;
  return items.value.filter((r) => r.status === filters.status);
});

async function loadReservations() {
  loading.value = true;
  try {
    items.value = await ReservationService.list({
      from: filters.from || undefined,
      to: filters.to || undefined,
      all: true,
    });
  } finally {
    loading.value = false;
  }
}
async function loadHistory() {
  try {
    history.value = await ReservationService.history();
  } catch {
    // interceptor cuida
  }
}

onMounted(async () => {
  await Promise.all([loadReservations(), loadHistory()]);
});

function openDeliver(reservation) {
  deliverDialog.reservation = reservation;
  deliverDialog.open = true;
}
async function confirmDeliver() {
  deliverDialog.busy = true;
  try {
    await ReservationService.deliver(deliverDialog.reservation.id);
    notifications.success('Reserva marcada como entregue.');
    deliverDialog.open = false;
    await loadReservations();
  } catch {
    // interceptor cuida
  } finally {
    deliverDialog.busy = false;
  }
}

function openAdminCancel(reservation) {
  cancelDialog.reservation = reservation;
  cancelDialog.reason = '';
  cancelDialog.open = true;
}
async function confirmAdminCancel() {
  if (!cancelDialog.reason.trim()) {
    notifications.error('Informe o motivo do cancelamento.');
    return;
  }
  cancelDialog.busy = true;
  try {
    await ReservationService.adminCancel(
      cancelDialog.reservation.id,
      cancelDialog.reason.trim()
    );
    notifications.success('Reserva cancelada.');
    cancelDialog.open = false;
    await Promise.all([loadReservations(), loadHistory()]);
  } catch {
    // interceptor cuida
  } finally {
    cancelDialog.busy = false;
  }
}

function fmtDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR');
}
</script>

<template>
  <AppLayout>
    <PageHeader
      title="Administração"
      subtitle="Visão completa da operação: reservas, entregas e cancelamentos."
    />

    <div class="flex gap-1 mb-6 border-b border-slate-200">
      <button
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px"
        :class="
          tab === 'reservas'
            ? 'border-brand-600 text-brand-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        "
        @click="tab = 'reservas'"
      >
        Todas as reservas
      </button>
      <button
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px"
        :class="
          tab === 'historico'
            ? 'border-brand-600 text-brand-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        "
        @click="tab = 'historico'"
      >
        Histórico de cancelamentos
      </button>
    </div>

    <section v-if="tab === 'reservas'">
      <form
        class="card p-4 mb-4 grid sm:grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 items-end"
        @submit.prevent="loadReservations"
      >
        <div>
          <label class="label">De</label>
          <input v-model="filters.from" type="date" class="input" />
        </div>
        <div>
          <label class="label">Até</label>
          <input v-model="filters.to" type="date" class="input" />
        </div>
        <div>
          <label class="label">Status</label>
          <select v-model="filters.status" class="input">
            <option value="todas">Todas</option>
            <option value="ativa">Ativa</option>
            <option value="entregue">Entregue</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <button class="btn-primary" :disabled="loading">Filtrar</button>
        <button
          type="button"
          class="btn-secondary"
          @click="filters.from = ''; filters.to = ''; filters.status = 'todas'; loadReservations()"
        >
          Limpar
        </button>
      </form>

      <div v-if="loading" class="text-slate-500">Carregando…</div>
      <EmptyState
        v-else-if="filteredItems.length === 0"
        title="Nenhuma reserva nesse filtro"
        message="Ajuste o intervalo ou o status para ver mais."
        icon="📋"
      />
      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ReservationCard
          v-for="r in filteredItems"
          :key="r.id"
          :reservation="r"
          :is-admin-view="true"
          @deliver="openDeliver"
          @admin-cancel="openAdminCancel"
        />
      </div>
    </section>

    <section v-else>
      <EmptyState
        v-if="history.length === 0"
        title="Nenhum cancelamento registrado"
        message="O histórico aparecerá aqui sempre que uma reserva for cancelada."
        icon="🗒️"
      />
      <div v-else class="card overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="text-left px-4 py-3 font-medium">Cliente</th>
              <th class="text-left px-4 py-3 font-medium">Pedido</th>
              <th class="text-left px-4 py-3 font-medium">Endereço</th>
              <th class="text-left px-4 py-3 font-medium">Quem cancelou</th>
              <th class="text-left px-4 py-3 font-medium">Motivo</th>
              <th class="text-left px-4 py-3 font-medium">Quando</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="h in history" :key="h.id">
              <td class="px-4 py-3">
                <p class="font-medium text-slate-800">{{ h.clientName || '—' }}</p>
                <p v-if="h.clientEmail" class="text-xs text-slate-400">{{ h.clientEmail }}</p>
              </td>
              <td class="px-4 py-3">
                <p v-if="h.reservationDate">
                  {{ h.reservationDate.split('-').reverse().join('/') }}
                  — {{ h.reservationMealType === 'almoco' ? 'Almoço' : h.reservationMealType === 'jantar' ? 'Jantar' : h.reservationMealType }}
                </p>
                <p v-if="h.reservationQuantity" class="text-xs text-slate-500">
                  {{ h.reservationQuantity }} marmita{{ h.reservationQuantity > 1 ? 's' : '' }}
                </p>
                <p v-if="!h.reservationDate" class="font-mono text-xs text-slate-400">
                  {{ h.reservationId.slice(0, 8) }}…
                </p>
              </td>
              <td class="px-4 py-3 text-slate-600 max-w-[200px]">
                {{ h.reservationDeliveryAddress || '—' }}
              </td>
              <td class="px-4 py-3">
                <span class="badge" :class="
                  h.cancelledByRole === 'admin'
                    ? 'bg-brand-50 text-brand-700'
                    : 'bg-slate-100 text-slate-600'
                ">
                  {{ h.cancelledByRole === 'admin' ? 'Admin' : 'Cliente' }}
                </span>
                <p v-if="h.cancelledByName" class="text-xs text-slate-400 mt-0.5">{{ h.cancelledByName }}</p>
              </td>
              <td class="px-4 py-3">{{ h.reason }}</td>
              <td class="px-4 py-3 text-slate-500 whitespace-nowrap">{{ fmtDateTime(h.cancelledAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ConfirmDialog
      v-model="deliverDialog.open"
      title="Marcar como entregue?"
      :message="
        deliverDialog.reservation
          ? `Confirmar entrega da reserva de ${deliverDialog.reservation.mealType} em ${deliverDialog.reservation.date}.`
          : ''
      "
      confirm-text="Confirmar entrega"
      :busy="deliverDialog.busy"
      @confirm="confirmDeliver"
    />

    <ConfirmDialog
      v-model="cancelDialog.open"
      v-model:reason="cancelDialog.reason"
      title="Cancelar reserva (admin)"
      :message="
        cancelDialog.reservation
          ? `Reserva de ${cancelDialog.reservation.mealType} em ${cancelDialog.reservation.date}. Informe o motivo do cancelamento.`
          : ''
      "
      confirm-text="Cancelar reserva"
      cancel-text="Voltar"
      variant="danger"
      :require-reason="true"
      reason-label="Motivo (obrigatório)"
      reason-placeholder="Ex.: Cantina fechada por evento"
      :busy="cancelDialog.busy"
      @confirm="confirmAdminCancel"
    />
  </AppLayout>
</template>
