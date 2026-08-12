<template>
  <section class="bg-f-primary p-6 text-f-bone md:p-7">
    <p class="eyebrow !text-f-brass-light">Tahmini fiyat</p>

    <p class="display mt-3 text-display-md text-f-bone">
      {{ formatTry(roundedTotal) }}
    </p>
    <p class="mt-1 text-sm text-f-bone/60">KDV dahil</p>

    <dl class="mt-6 flex flex-col">
      <div
        v-for="line in price.lines"
        :key="line.label"
        class="flex items-baseline justify-between gap-4 border-t border-f-bone/15 py-2 text-sm"
      >
        <dt class="text-f-bone/70">{{ line.label }}</dt>
        <dd class="shrink-0 text-f-bone/90">{{ formatTry(line.amount) }}</dd>
      </div>

      <div
        v-if="price.vat > 0"
        class="flex items-baseline justify-between gap-4 border-t border-f-bone/15 py-2 text-sm"
      >
        <dt class="text-f-bone/70">KDV</dt>
        <dd class="shrink-0 text-f-bone/90">{{ formatTry(price.vat) }}</dd>
      </div>
    </dl>

    <RouterLink
      :to="{ name: ERouteNames.Contact, query: { [CONFIG_QUERY_KEY]: configCode } }"
      class="mt-7 block bg-f-bone py-4 text-center text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-primary transition-colors duration-300 hover:bg-f-brass-light"
    >
      Bu Tasarım İçin Teklif Al
    </RouterLink>

    <p class="mt-4 text-sm text-f-bone/60">
      Bu bir ön tahmindir, bağlayıcı teklif değildir. Kesin fiyat ücretsiz
      keşiften sonra netleşir.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { ERouteNames } from '@/router/routeNames.enum';

import { CONFIG_QUERY_KEY } from '../../_etc/configUrl';

import type { IPriceBreakdown } from '../../_etc/pricing/priceBook';

interface IProps {
  price: IPriceBreakdown;
  /** Tasarımı taşıyan kod; teklif bağlantısına iliştirilir. */
  configCode: string;
}

const props = defineProps<IProps>();

/*
 * Yuvarlama SUNUMDA yapılıyor, motorda değil: `priceOf` tam sayıyı veriyor,
 * ekran onu okunur hale getiriyor. Kuruşuna kadar bir rakam göstermek, tahmini
 * olduğundan kesin gösterir — düğmenin hemen altında "bağlayıcı teklif
 * değildir" yazarken bu çelişkili olurdu.
 */
function formatTry(value: number): string {
  return `₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`;
}

/** Toplam onluğa çekilir; kalemler tam sayıya. */
const roundedTotal = computed(() => Math.round(props.price.total / 10) * 10);
</script>
