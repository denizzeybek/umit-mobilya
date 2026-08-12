<template>
  <div
    class="mx-auto max-w-editorial px-5 py-12 md:px-10 md:py-20 lg:px-16 xl:px-24"
  >
    <header class="border-b border-f-rule pb-8">
      <p class="eyebrow">{{ definition.eyebrow }}</p>
      <h1 class="display mt-5 max-w-[18ch] text-display-md text-f-ink">
        {{ definition.headline }}
      </h1>
      <p class="prose-lede mt-5 max-w-prose">{{ definition.lede }}</p>
    </header>

    <div class="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-16 xl:gap-20">
      <ProductViewer
        :content="content"
        :size="config"
        :version="version"
        class="h-[52svh] min-h-[380px] lg:sticky lg:top-28 lg:h-[calc(100svh-9rem)] lg:self-start"
      />

      <ConfiguratorPanel
        v-model="config"
        :definition="definition"
        :parts="parts"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ConfiguratorPanel from '../_components/ConfiguratorPanel.vue';
import ProductViewer from '../_components/ProductViewer.vue';
import {
  CONFIG_QUERY_KEY,
  decodeConfig,
  encodeConfig,
} from '../_etc/configUrl';
import { applyDoorOpen, buildFromParts } from '../_etc/geometry/buildFromParts';
import { DEFAULT_PRICE_BOOK } from '../_etc/pricing/defaults';
import { sanitizeConfig } from '../_etc/sanitizeConfig';

import type {
  IBaseConfig,
  IProductBuild,
  IProductDefinition,
} from '../_etc/types';
import type { Object3D } from 'three';

/**
 * Bu görünüm hangi ürünü gösterdiğini bilmiyor: tanım route'tan geliyor,
 * içindeki `build`/`price`/`fields` ne olduğunu kendisi söylüyor. Vestiyer ve
 * mutfak eklendiğinde bu dosya değişmeyecek.
 */
interface IProps {
  definition: IProductDefinition;
}

const props = defineProps<IProps>();

const route = useRoute();
const router = useRouter();

/**
 * Adresteki tasarım, varsayılandan önce gelir. Başka bir ürüne ait ya da
 * okunamayan bir kod sessizce yok sayılır — `sanitizeConfig` gövdeyi bu ürünün
 * sınırlarına oturttuğu için buraya geçersiz bir config ulaşamaz.
 */
const configFromUrl = (): IBaseConfig | null => {
  const decoded = decodeConfig(route.query[CONFIG_QUERY_KEY]);
  if (!decoded || decoded.t !== props.definition.id) return null;

  return sanitizeConfig(decoded.c, props.definition);
};

const config = ref(configFromUrl() ?? props.definition.createDefault());

/**
 * `shallowRef` bilinçli: Three.js nesne ağacını Vue'nun derin reaktifliğine
 * sokmak hem gereksiz proxy maliyeti hem de matris güncellemelerinde sessiz
 * hatalar demek. Sahne zaten bütün olarak değiştiriliyor.
 */
const content = shallowRef<Object3D | null>(null);

/**
 * İçerik yerinde değiştiğinde (kapak açısı) referans aynı kalıyor; sayacı
 * artırmak görüntüleyiciden yeniden çizim istemenin tek yolu.
 */
const version = ref(0);

let build: IProductBuild | null = null;

/*
 * Parça listesi tek kaynak: aynı liste hem sahneyi hem paneldeki fiyatı
 * besliyor, o yüzden burada bir kez üretilip ikisine de veriliyor.
 */
const parts = computed(() =>
  props.definition.parts(config.value, DEFAULT_PRICE_BOOK),
);

const rebuild = () => {
  const previous = build;
  const next = buildFromParts({
    config: config.value,
    parts: parts.value,
    book: DEFAULT_PRICE_BOOK,
  });

  build = next;
  applyDoorOpen(next.doorPivots, config.value.doorOpen);
  content.value = next.group;
  version.value += 1;

  previous?.dispose();
};

/*
 * Kapak açısı sahneyi yeniden kurmadan güncelleniyor: kaydırıcı sürüklenirken
 * saniyede onlarca kez yeniden inşa etmek gereksiz, tek yapılan bir rotasyon.
 */
watch(
  () => config.value.doorOpen,
  (amount) => {
    if (!build) return;
    applyDoorOpen(build.doorPivots, amount);
    version.value += 1;
  },
);

watch(
  () => {
    const { doorOpen: _doorOpen, ...rest } = config.value;
    return JSON.stringify(rest);
  },
  rebuild,
  { immediate: true },
);

watch(
  () => props.definition,
  (next) => {
    config.value = next.createDefault();
  },
);

/*
 * `replace` ve 300 ms gecikme birlikte: kaydırıcı sürüklenirken her karede
 * geçmişe yazmak hem tarayıcıyı zorlar hem geri düğmesini kırk adım geri
 * götürürdü. Yazma ilk değişiklikte başlıyor — dokunulmamış bir tasarım
 * adresi kirletmesin.
 */
let urlTimer: ReturnType<typeof setTimeout> | undefined;

const writeConfigToUrl = () => {
  clearTimeout(urlTimer);

  urlTimer = setTimeout(() => {
    router.replace({
      query: {
        ...route.query,
        [CONFIG_QUERY_KEY]: encodeConfig(props.definition.id, config.value),
      },
    });
  }, 300);
};

watch(config, writeConfigToUrl, { deep: true });

onBeforeUnmount(() => {
  clearTimeout(urlTimer);
  build?.dispose();
});
</script>
