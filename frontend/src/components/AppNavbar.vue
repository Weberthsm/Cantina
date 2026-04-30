<script setup>
import { computed } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const links = computed(() => {
  const items = [
    { name: 'dashboard', label: 'Início' },
    { name: 'reservations', label: 'Minhas reservas' },
    { name: 'reservations.new', label: 'Nova reserva' },
    { name: 'profile', label: 'Perfil' },
  ];
  if (auth.isAdmin) {
    items.push({ name: 'admin', label: 'Administração' });
  }
  return items;
});

function isActive(name) {
  return route.matched.some((m) => m.name === name);
}

function handleLogout() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <header class="bg-white border-b border-slate-200">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
      <RouterLink :to="{ name: 'dashboard' }" class="flex items-center gap-2 mr-8">
        <span class="text-2xl">🍱</span>
        <span class="font-semibold text-slate-900">Cantina</span>
      </RouterLink>
      <nav class="hidden md:flex items-center gap-1">
        <RouterLink
          v-for="link in links"
          :key="link.name"
          :to="{ name: link.name }"
          class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="
            isActive(link.name)
              ? 'bg-brand-50 text-brand-700'
              : 'text-slate-600 hover:bg-slate-100'
          "
        >
          {{ link.label }}
        </RouterLink>
      </nav>
      <div class="ml-auto flex items-center gap-3">
        <div class="hidden sm:block text-right">
          <p class="text-sm font-medium text-slate-800 leading-none">
            {{ auth.user?.name }}
          </p>
          <p class="text-xs text-slate-500">
            {{ auth.isAdmin ? 'Administrador' : 'Cliente' }}
          </p>
        </div>
        <button class="btn-ghost text-sm" @click="handleLogout">Sair</button>
      </div>
    </div>
    <div class="md:hidden border-t border-slate-200 bg-slate-50">
      <div class="max-w-6xl mx-auto px-2 py-2 flex gap-1 overflow-x-auto">
        <RouterLink
          v-for="link in links"
          :key="link.name"
          :to="{ name: link.name }"
          class="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap"
          :class="
            isActive(link.name)
              ? 'bg-brand-100 text-brand-700'
              : 'text-slate-600'
          "
        >
          {{ link.label }}
        </RouterLink>
      </div>
    </div>
  </header>
</template>
