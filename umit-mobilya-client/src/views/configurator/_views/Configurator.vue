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

      <ConfiguratorPanel v-model="config" :definition="definition" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue';

import ConfiguratorPanel from '../_components/ConfiguratorPanel.vue';
import ProductViewer from '../_components/ProductViewer.vue';
import { applyDoorOpen } from '../_etc/geometry/doors';

import type { IProductBuild, IProductDefinition } from '../_etc/types';
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

const config = ref(props.definition.createDefault());

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

const rebuild = () => {
  const previous = build;

  build = props.definition.build(config.value);
  applyDoorOpen(build.doorPivots, config.value.doorOpen);
  content.value = build.group;
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

onBeforeUnmount(() => build?.dispose());
</script>
