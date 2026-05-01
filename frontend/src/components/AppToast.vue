<script setup>
/**
 * Container de toasts. Lê do store global e renderiza no canto superior direito.
 */
import { useNotificationStore } from '@/stores/notifications';

const store = useNotificationStore();

const variants = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  info: 'bg-sky-50 border-sky-200 text-sky-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  error: 'bg-rose-50 border-rose-200 text-rose-800',
};
const icons = {
  success: '✓',
  info: 'ℹ',
  warning: '!',
  error: '×',
};
</script>

<template>
  <div class="fixed top-4 right-4 z-50 space-y-3 w-[min(360px,90vw)]">
    <transition-group name="toast" tag="div" class="space-y-3">
      <div
        v-for="item in store.items"
        :key="item.id"
        class="rounded-lg border shadow-card px-4 py-3 flex gap-3 items-start"
        :class="variants[item.type] || variants.info"
        role="status"
      >
        <span
          class="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold bg-white/60"
          aria-hidden="true"
        >{{ icons[item.type] || icons.info }}</span>
        <div class="flex-1">
          <p v-if="item.title" class="font-semibold leading-tight" data-testid="toast-title">{{ item.title }}</p>
          <p class="text-sm leading-snug opacity-90" data-testid="toast-message">{{ item.message }}</p>
        </div>
        <button
          class="text-current/70 hover:text-current"
          aria-label="Fechar"
          @click="store.dismiss(item.id)"
        >
          ×
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
