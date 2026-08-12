<template>
  <section class="border border-f-rule bg-f-paper p-6 md:p-7">
    <p class="eyebrow">Bu işi beğendin mi?</p>

    <p class="mt-4 text-f-ink">
      Ölçüler senin mekânına göre alınır. Benzerini kendi ölçünle kurup anında
      tahmini fiyatını görebilirsin.
    </p>

    <RouterLink
      v-if="target"
      :to="target"
      class="mt-6 block bg-f-primary py-4 text-center text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-paper transition-colors duration-300 hover:bg-f-primary-hovered"
    >
      Benzerini Kendi Ölçünle Kur
    </RouterLink>

    <RouterLink
      v-else
      :to="{ name: ERouteNames.Contact }"
      class="mt-6 block bg-f-primary py-4 text-center text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-paper transition-colors duration-300 hover:bg-f-primary-hovered"
    >
      Bu İş İçin Teklif Al
    </RouterLink>

    <p class="mt-4 text-sm text-f-ink-muted">
      Keşif ücretsiz. Ölçüyü biz alırız.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { ERouteNames } from '@/router/routeNames.enum';
import {
  CONFIG_QUERY_KEY,
  encodeConfig,
} from '@/views/configurator/_etc/configUrl';

import type { EProductType, IBaseConfig } from '@/views/configurator/_etc/types';

/**
 * Portfolyoyu vitrin olmaktan çıkarıp huniye çeviren köprü: fotoğraf ilgi
 * çekiyor, tek tık konfigüratöre, oradan teklife.
 *
 * Başlangıç noktası ürün kaydında (`configuratorPreset`). Yoksa düğme
 * İletişim'e gidiyor — portfolyodaki her işin konfigüratörde karşılığı yok
 * (mutfağın geometrisi henüz yazılmadı) ve olmayan bir ürüne yönlendirmek
 * kullanıcıyı 404'e götürürdü.
 *
 * Ek mekanizma gerekmedi: config'i URL'e kodlayan yol zaten var.
 */
interface IProps {
  preset?: Record<string, unknown> | null;
}

const props = defineProps<IProps>();

const target = computed(() => {
  const preset = props.preset;
  if (!preset) return null;

  const productType = preset['productType'] as EProductType | undefined;
  const config = preset['config'] as IBaseConfig | undefined;
  if (!productType || !config) return null;

  return {
    name: ERouteNames.Configurator,
    params: { product: productType },
    query: { [CONFIG_QUERY_KEY]: encodeConfig(productType, config) },
  };
});
</script>
