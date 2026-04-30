<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmação' },
  message: { type: String, default: 'Tem certeza?' },
  confirmText: { type: String, default: 'Confirmar' },
  cancelText: { type: String, default: 'Cancelar' },
  variant: { type: String, default: 'primary' }, // primary | danger
  requireReason: { type: Boolean, default: false },
  reasonLabel: { type: String, default: 'Motivo' },
  reasonPlaceholder: { type: String, default: 'Descreva o motivo' },
  reason: { type: String, default: '' },
  busy: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'update:reason', 'confirm', 'cancel']);

const confirmClass = computed(() =>
  props.variant === 'danger' ? 'btn-danger' : 'btn-primary'
);

function close() {
  emit('update:modelValue', false);
  emit('cancel');
}
function confirm() {
  emit('confirm');
}
function onReason(e) {
  emit('update:reason', e.target.value);
}
</script>

<template>
  <transition name="modal">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40"
      role="dialog"
      aria-modal="true"
      @click.self="close"
    >
      <div class="card max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
        <p class="mt-2 text-sm text-slate-600 whitespace-pre-line">{{ message }}</p>
        <div v-if="requireReason" class="mt-4">
          <label class="label">{{ reasonLabel }}</label>
          <textarea
            class="input min-h-[88px]"
            :placeholder="reasonPlaceholder"
            :value="reason"
            @input="onReason"
          />
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button class="btn-secondary" :disabled="busy" @click="close">
            {{ cancelText }}
          </button>
          <button :class="confirmClass" :disabled="busy" @click="confirm">
            <span v-if="busy" class="animate-pulse">Aguarde…</span>
            <span v-else>{{ confirmText }}</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
