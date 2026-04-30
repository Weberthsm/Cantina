<script setup>
import AppNavbar from './AppNavbar.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppNavbar />
    <main class="flex-1">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <slot />
      </div>
    </main>
    <footer class="text-center text-xs text-slate-500 py-4">
      Cantina API • Rodando em
      <code class="text-slate-700">{{ apiHint }}</code>
    </footer>
  </div>
</template>

<script>
export default {
  computed: {
    apiHint() {
      return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    },
  },
};
</script>
