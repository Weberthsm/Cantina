<script setup>
defineProps({
  status: { type: String, required: true },
});

const styles = {
  ativa: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelada: 'bg-rose-50 text-rose-700 border border-rose-200',
  entregue: 'bg-sky-50 text-sky-700 border border-sky-200',
};
const labels = {
  ativa: 'Ativa',
  cancelada: 'Cancelada',
  entregue: 'Entregue',
};
</script>

<template>
  <span class="badge" :class="styles[status] || 'bg-slate-100 text-slate-700'">
    {{ labels[status] || status }}
  </span>
</template>
