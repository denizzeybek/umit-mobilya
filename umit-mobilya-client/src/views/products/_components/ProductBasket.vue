<template>
  <div class="border border-f-rule bg-f-paper p-6 md:p-8">
    <p class="eyebrow">Özet</p>

    <h1 class="display mt-4 text-display-sm text-f-ink">
      {{ currentProduct?.name }}
    </h1>

    <p class="mt-2 text-sm text-f-ink-muted">
      <span v-if="currentProduct?.category?.name">
        {{ currentProduct.category.name }}
      </span>
      <span v-if="hasSizes" class="text-f-ink-faint">
        · {{ currentProduct?.sizes }}
      </span>
    </p>

    <p v-if="currentProduct?.description" class="mt-5 text-f-ink-muted">
      {{ currentProduct.description }}
    </p>

    <dl v-if="hasModules && basket.length" class="mt-8 flex flex-col">
      <div
        v-for="(item, index) in basket"
        :key="`${item._id}-${index}`"
        class="flex items-baseline justify-between gap-4 border-t border-f-rule py-3"
      >
        <dt class="min-w-0 flex-1 truncate text-sm text-f-ink-muted">
          {{ item.name }}
          <span v-if="item.quantity > 1" class="text-f-ink-faint">
            × {{ item.quantity }}
          </span>
        </dt>
        <dd class="shrink-0 text-sm text-f-ink">
          {{ formatPrice(item.price * item.quantity, item.currency) }}
        </dd>
      </div>
    </dl>

    <div
      class="mt-8 flex items-baseline justify-between border-t-2 border-f-ink pt-5"
    >
      <span class="eyebrow">Toplam</span>
      <span class="display text-2xl text-f-primary">{{ totalLabel }}</span>
    </div>

    <RouterLink
      :to="{ name: ERouteNames.Contact }"
      class="mt-7 block bg-f-primary py-4 text-center text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-paper transition-colors duration-300 hover:bg-f-primary-hovered"
    >
      Bu Kurulum İçin Teklif Al
    </RouterLink>

    <a
      :href="WHATSAPP_URL"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-3 block border border-f-rule-strong py-4 text-center text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-ink transition-colors duration-300 hover:border-f-primary"
    >
      WhatsApp’tan Sor
    </a>

    <p class="mt-5 text-sm text-f-ink-faint">
      Fiyat gösterilen kurulum içindir. Ölçü ve malzeme değiştikçe değişir;
      kesin fiyat keşiften sonra netleşir.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { WHATSAPP_URL } from '@/constants/company';
import { ERouteNames } from '@/router/routeNames.enum';
import { useProductsStore } from '@/stores/products';

interface IProps {
  hasModules: boolean;
}

const props = defineProps<IProps>();

const productsStore = useProductsStore();

const currentProduct = computed(() => productsStore.currentProduct);
const basket = computed(() => productsStore.currentProductBasket);

const hasSizes = computed(
  () =>
    Boolean(currentProduct.value?.sizes) &&
    currentProduct.value?.sizes !== '0',
);

const totalLabel = computed(() => {
  if (props.hasModules) {
    const total = productsStore.currentProductTotal;
    return formatPrice(total?.price ?? 0, total?.currency ?? '');
  }

  return formatPrice(
    currentProduct.value?.price ?? 0,
    currentProduct.value?.currency ?? '',
  );
});

function formatPrice(value: number, currency: string): string {
  return `${new Intl.NumberFormat('tr-TR').format(value)} ${currency}`.trim();
}
</script>
