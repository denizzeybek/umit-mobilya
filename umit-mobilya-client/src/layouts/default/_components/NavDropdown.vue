<template>
  <div v-click-outside="close" class="relative">
    <button
      type="button"
      class="nav-link inline-flex items-center gap-2"
      :class="tone"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="isOpen = !isOpen"
    >
      {{ label }}
      <span
        class="pi pi-angle-down !text-[0.7rem] transition-transform duration-300"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition name="drop">
      <div
        v-if="isOpen"
        class="absolute left-0 top-full min-w-[15rem] border border-f-rule bg-f-paper py-2 shadow-[0_18px_40px_-24px_rgba(28,26,22,0.5)]"
      >
        <template v-for="(item, index) in items" :key="index">
          <span v-if="item.separatorBefore" class="my-2 block h-px bg-f-rule" />
          <RouterLink :to="item.to" class="dropdown-link" @click="close">
            {{ item.label }}
          </RouterLink>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { RouteLocationRaw } from 'vue-router';

/**
 * Üst menüdeki açılır liste. Kategoriler ve ürün tipleri aynı davranışı
 * paylaşıyor; ikinci kez yazmak yerine buraya alındı.
 */
export interface INavDropdownItem {
  label: string;
  to: RouteLocationRaw;
  separatorBefore?: boolean;
}

interface IProps {
  label: string;
  items: INavDropdownItem[];
  tone: string;
}

defineProps<IProps>();

const route = useRoute();

const isOpen = ref(false);

const close = () => {
  isOpen.value = false;
};

watch(() => route.fullPath, close);
</script>

<style scoped lang="scss">
.nav-link {
  @apply px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300;
}

.dropdown-link {
  @apply block px-5 py-2.5 text-sm text-f-ink-muted transition-colors duration-200 hover:bg-f-linen hover:text-f-ink;
}

.drop-enter-active,
.drop-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-0.4rem);
}
</style>
