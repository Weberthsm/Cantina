<script setup>
defineProps({
  title: { type: String, default: 'Nada por aqui' },
  message: { type: String, default: '' },
  icon: { type: String, default: '📭' },
});
</script>

<template>
  <div class="card p-10 text-center">
    <div class="text-4xl mb-3" aria-hidden="true">{{ icon }}</div>
    <p class="text-slate-800 font-medium">{{ title }}</p>
    <p v-if="message" class="text-slate-500 text-sm mt-1">{{ message }}</p>
    <div class="mt-4">
      <slot />
    </div>
  </div>
</template>
