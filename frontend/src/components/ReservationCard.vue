<script setup>
import StatusBadge from './StatusBadge.vue';

defineProps({
  reservation: { type: Object, required: true },
  showActions: { type: Boolean, default: true },
  isAdminView: { type: Boolean, default: false },
});
defineEmits(['cancel', 'deliver', 'admin-cancel']);

const mealLabels = {
  almoco: 'Almoço',
  jantar: 'Jantar',
};
function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function fmtDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR');
}
</script>

<template>
  <article class="card p-5 flex flex-col gap-3">
    <header class="flex items-start justify-between gap-2">
      <div>
        <p class="text-xs uppercase tracking-wide text-slate-500">
          {{ mealLabels[reservation.mealType] || reservation.mealType }}
        </p>
        <p class="text-lg font-semibold text-slate-900">
          {{ fmtDate(reservation.date) }}
        </p>
      </div>
      <StatusBadge :status="reservation.status" />
    </header>
    <dl class="text-sm text-slate-600 grid grid-cols-1 gap-1">
      <div class="flex justify-between gap-2">
        <dt class="text-slate-400">Quantidade</dt>
        <dd>{{ reservation.quantity || 1 }} marmita{{ (reservation.quantity || 1) > 1 ? 's' : '' }}</dd>
      </div>
      <div v-if="reservation.deliveryAddress" class="flex justify-between gap-2">
        <dt class="text-slate-400">Endereço de entrega</dt>
        <dd class="text-right max-w-[200px]">{{ reservation.deliveryAddress }}</dd>
      </div>
      <div class="flex justify-between gap-2">
        <dt class="text-slate-400">Criada em</dt>
        <dd>{{ fmtDateTime(reservation.createdAt) }}</dd>
      </div>
      <div v-if="reservation.cancelledAt" class="flex justify-between gap-2">
        <dt class="text-slate-400">Cancelada em</dt>
        <dd>{{ fmtDateTime(reservation.cancelledAt) }}</dd>
      </div>
      <div v-if="reservation.cancelReason" class="flex justify-between gap-2">
        <dt class="text-slate-400">Motivo</dt>
        <dd class="text-right">{{ reservation.cancelReason }}</dd>
      </div>
      <div v-if="reservation.deliveredAt" class="flex justify-between gap-2">
        <dt class="text-slate-400">Entregue em</dt>
        <dd>{{ fmtDateTime(reservation.deliveredAt) }}</dd>
      </div>
      <template v-if="isAdminView">
        <div class="border-t border-slate-100 mt-1 pt-1 flex justify-between gap-2">
          <dt class="text-slate-400">Cliente</dt>
          <dd class="text-right font-medium">{{ reservation.clientName || '—' }}</dd>
        </div>
        <div v-if="reservation.clientEmail" class="flex justify-between gap-2">
          <dt class="text-slate-400">E-mail</dt>
          <dd class="text-right text-xs truncate max-w-[180px]">{{ reservation.clientEmail }}</dd>
        </div>
        <div v-if="reservation.clientPhone" class="flex justify-between gap-2">
          <dt class="text-slate-400">Telefone</dt>
          <dd>{{ reservation.clientPhone }}</dd>
        </div>
        <div v-if="reservation.clientCpf" class="flex justify-between gap-2">
          <dt class="text-slate-400">CPF</dt>
          <dd>{{ reservation.clientCpf }}</dd>
        </div>
      </template>
    </dl>

    <footer
      v-if="showActions && reservation.status === 'ativa'"
      class="flex flex-wrap gap-2 pt-2 border-t border-slate-100"
    >
      <button
        v-if="!isAdminView"
        class="btn-secondary text-sm"
        :data-testid="`btn-cancel-reservation-${reservation.id}`"
        @click="$emit('cancel', reservation)"
      >
        Cancelar reserva
      </button>
      <template v-if="isAdminView">
        <button
          class="btn-primary text-sm"
          :data-testid="`btn-deliver-${reservation.id}`"
          @click="$emit('deliver', reservation)"
        >
          Marcar entregue
        </button>
        <button
          class="btn-danger text-sm"
          :data-testid="`btn-admin-cancel-${reservation.id}`"
          @click="$emit('admin-cancel', reservation)"
        >
          Cancelar (admin)
        </button>
      </template>
    </footer>
  </article>
</template>
