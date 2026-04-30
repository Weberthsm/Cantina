<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
});
</script>

<template>
  <header class="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">{{ title }}</h1>
      <p v-if="subtitle" class="text-slate-500 text-sm mt-1">{{ subtitle }}</p>
    </div>
    <div class="flex gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
