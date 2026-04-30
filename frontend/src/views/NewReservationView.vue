<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import PageHeader from '@/components/PageHeader.vue';
import { ReservationService } from '@/services/reservation.service';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';

const auth = useAuthStore();
const router = useRouter();
const notifications = useNotificationStore();

const today = new Date().toISOString().slice(0, 10);

// Limite diário por pessoa (precisa estar alinhado com o backend).
const MAX_PER_DAY = 5;

const form = reactive({
  date: today,
  mealType: 'almoco',
  quantity: 1,
});
const busy = ref(false);

// Disponibilidade carregada da API. Inclui cutoffHour por refeição,
// alinhado com o que está configurado no backend (.env).
const availability = ref(null);
const loadingAvailability = ref(false);

// Reservas do usuário na data alvo (para calcular quanto resta no dia).
const myReservationsForDate = ref([]);

const profileMissing = computed(() => !auth.profileComplete);
const isToday = computed(() => form.date === today);
const selectedAvailability = computed(
  () => availability.value?.[form.mealType] || null
);
// Horários de corte vêm do backend; só aparecem após o load.
const cutoffAlmoco = computed(() => availability.value?.almoco?.cutoffHour);
const cutoffJantar = computed(() => availability.value?.jantar?.cutoffHour);
const currentCutoff = computed(
  () => availability.value?.[form.mealType]?.cutoffHour
);

// Quantas marmitas o usuário já reservou no dia (somando quantity).
const myDailyUsed = computed(() =>
  myReservationsForDate.value.reduce(
    (acc, r) => acc + (Number(r.quantity) || 1),
    0
  )
);
const myDailyRemaining = computed(() =>
  Math.max(0, MAX_PER_DAY - myDailyUsed.value)
);
const userHasMealOnDate = computed(() =>
  myReservationsForDate.value.some((r) => r.mealType === form.mealType)
);
// Máximo permitido pra refeição selecionada: o que sobra no estoque
// e o que sobra no orçamento diário do usuário.
const maxQuantity = computed(() => {
  const stockRemaining = selectedAvailability.value?.available ?? 0;
  return Math.max(0, Math.min(stockRemaining, myDailyRemaining.value));
});
const canSubmit = computed(() => {
  if (busy.value || loadingAvailability.value) return false;
  if (userHasMealOnDate.value) return false;
  if (form.quantity < 1) return false;
  if (form.quantity > maxQuantity.value) return false;
  return true;
});

async function loadAvailability() {
  if (!form.date) return;
  loadingAvailability.value = true;
  try {
    const [avail, mine] = await Promise.all([
      ReservationService.availability(form.date),
      ReservationService.list({ from: form.date, to: form.date }),
    ]);
    availability.value = avail;
    myReservationsForDate.value = (mine || []).filter(
      (r) => r.status === 'ativa'
    );
    // Ajusta quantity ao máximo permitido (pode ter caído após mudança de data).
    if (form.quantity > maxQuantity.value) {
      form.quantity = Math.max(1, maxQuantity.value);
    }
  } catch {
    availability.value = null;
    myReservationsForDate.value = [];
    // erro já tratado no interceptor
  } finally {
    loadingAvailability.value = false;
  }
}

function statusFor(meal) {
  const a = availability.value?.[meal];
  if (!a) return null;
  if (a.available <= 0) {
    return { tone: 'rose', label: 'Esgotado' };
  }
  if (a.available <= Math.max(3, Math.ceil(a.stock * 0.1))) {
    return { tone: 'amber', label: `Quase esgotado · ${a.available} restantes` };
  }
  return { tone: 'emerald', label: `${a.available} disponíveis` };
}

const toneClasses = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
};

onMounted(loadAvailability);
watch(() => form.date, loadAvailability);
watch(
  () => form.mealType,
  () => {
    if (form.quantity > maxQuantity.value) {
      form.quantity = Math.max(1, maxQuantity.value);
    }
  }
);

async function submit() {
  busy.value = true;
  try {
    await ReservationService.create(form);
    notifications.success('Reserva criada com sucesso!');
    router.push({ name: 'reservations' });
  } catch {
    // interceptor cuida; recarrega disponibilidade caso outro cliente tenha esgotado
    loadAvailability();
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AppLayout>
    <PageHeader
      title="Nova reserva"
      subtitle="Garanta sua marmita escolhendo a data e a refeição."
    />

    <div v-if="profileMissing" class="card p-6 mb-6 bg-amber-50 border-amber-200">
      <h2 class="font-semibold text-amber-900">Complete seu perfil antes de reservar</h2>
      <p class="text-sm text-amber-800 mt-1">
        Para reservar, precisamos do seu nome completo, CPF, telefone e endereço.
      </p>
      <RouterLink :to="{ name: 'profile' }" class="btn-primary mt-4 inline-flex">
        Completar perfil
      </RouterLink>
    </div>

    <form v-else class="card p-6 max-w-lg space-y-5" @submit.prevent="submit">
      <div>
        <label class="label">Data da refeição</label>
        <input
          v-model="form.date"
          type="date"
          :min="today"
          class="input"
          required
        />
        <p v-if="cutoffAlmoco != null && cutoffJantar != null" class="text-xs text-slate-500 mt-1">
          Cada refeição tem seu próprio horário de corte:
          almoço até <strong>{{ cutoffAlmoco }}h</strong>,
          jantar até <strong>{{ cutoffJantar }}h</strong>.
          <span v-if="isToday && currentCutoff != null">
            Para hoje, finalize antes das <strong>{{ currentCutoff }}h</strong>.
          </span>
        </p>
        <p v-else class="text-xs text-slate-400 mt-1">Carregando regras…</p>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="label !mb-0">Refeição</label>
          <span v-if="loadingAvailability" class="text-xs text-slate-400">
            verificando disponibilidade…
          </span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label
            v-for="opt in [
              { value: 'almoco', label: 'Almoço', icon: '🍛' },
              { value: 'jantar', label: 'Jantar', icon: '🍝' },
            ]"
            :key="opt.value"
            class="rounded-lg border-2 p-4 text-center transition relative"
            :class="[
              availability?.[opt.value]?.available === 0
                ? 'opacity-60 cursor-not-allowed border-slate-200'
                : 'cursor-pointer',
              form.mealType === opt.value
                ? 'border-brand-500 bg-brand-50'
                : 'border-slate-200 hover:border-slate-300',
            ]"
          >
            <input
              v-model="form.mealType"
              type="radio"
              :value="opt.value"
              :disabled="availability?.[opt.value]?.available === 0"
              class="sr-only"
            />
            <span class="text-2xl block">{{ opt.icon }}</span>
            <span class="text-sm font-medium block">{{ opt.label }}</span>
            <span
              v-if="statusFor(opt.value)"
              class="badge mt-2 border"
              :class="toneClasses[statusFor(opt.value).tone]"
            >
              {{ statusFor(opt.value).label }}
            </span>
            <span v-else-if="loadingAvailability" class="text-[10px] text-slate-400 block mt-2">
              …
            </span>
          </label>
        </div>
        <p
          v-if="selectedAvailability"
          class="text-xs text-slate-500 mt-2"
        >
          Capacidade do dia para {{ form.mealType === 'almoco' ? 'almoço' : 'jantar' }}:
          <strong>{{ selectedAvailability.stock }}</strong> ·
          já reservadas: <strong>{{ selectedAvailability.used }}</strong> ·
          disponíveis: <strong>{{ selectedAvailability.available }}</strong>
        </p>
      </div>

      <div>
        <label class="label">Quantidade</label>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="btn-secondary !px-3"
            aria-label="Diminuir"
            :disabled="form.quantity <= 1"
            @click="form.quantity = Math.max(1, form.quantity - 1)"
          >−</button>
          <input
            v-model.number="form.quantity"
            type="number"
            min="1"
            :max="maxQuantity || 1"
            class="input text-center w-20"
            :disabled="maxQuantity === 0"
          />
          <button
            type="button"
            class="btn-secondary !px-3"
            aria-label="Aumentar"
            :disabled="form.quantity >= maxQuantity"
            @click="form.quantity = Math.min(maxQuantity, form.quantity + 1)"
          >+</button>
          <span class="text-xs text-slate-500">
            (máx <strong>{{ maxQuantity }}</strong>)
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-2">
          Limite diário por pessoa: <strong>{{ MAX_PER_DAY }}</strong> marmitas ·
          já reservadas hoje: <strong>{{ myDailyUsed }}</strong> ·
          ainda pode reservar: <strong>{{ myDailyRemaining }}</strong>
        </p>
        <p v-if="userHasMealOnDate" class="text-xs text-amber-700 mt-1">
          Você já tem uma reserva ativa de {{ form.mealType === 'almoco' ? 'almoço' : 'jantar' }} nesse dia.
          Cancele-a antes de criar outra.
        </p>
      </div>

      <div class="flex gap-3 justify-end">
        <RouterLink :to="{ name: 'reservations' }" class="btn-secondary">Cancelar</RouterLink>
        <button class="btn-primary" :disabled="!canSubmit">
          <span v-if="busy">Criando…</span>
          <span v-else-if="selectedAvailability && selectedAvailability.available <= 0">
            Esgotado
          </span>
          <span v-else-if="userHasMealOnDate">Já reservado</span>
          <span v-else>
            Confirmar
            <template v-if="form.quantity > 1">{{ form.quantity }} marmitas</template>
            <template v-else>reserva</template>
          </span>
        </button>
      </div>
    </form>
  </AppLayout>
</template>
