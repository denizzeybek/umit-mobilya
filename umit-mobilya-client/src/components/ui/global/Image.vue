<template>
  <div
    class="relative overflow-hidden bg-f-linen"
    :style="ratio ? { aspectRatio: ratio } : undefined"
  >
    <div
      class="pointer-events-none absolute inset-0 z-10 bg-f-linen transition-opacity duration-700 ease-editorial"
      :class="status === 'loading' ? 'animate-pulse opacity-100' : 'opacity-0'"
      aria-hidden="true"
    />

    <div
      v-if="status === 'error'"
      class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-f-linen text-f-ink-faint"
      aria-hidden="true"
    >
      <span class="block h-px w-10 bg-f-rule-strong" />
      <span class="eyebrow">Görsel yok</span>
    </div>

    <!--
      Görsel gizlenirken `display: none` KULLANILMAZ. Tarayıcı, display:none
      olan bir `loading="lazy"` görselini hiç indirmiyor; v-show ile gizlenince
      kare sonsuza kadar iskelet halinde kalıyordu. Bunun yerine görsel her
      zaman yerleşimde durur, yalnızca saydamlığı değişir.
    -->
    <img
      :src="src ?? undefined"
      :srcset="computedSrcset"
      :sizes="sizes"
      :alt="alt"
      :loading="isEager ? 'eager' : 'lazy'"
      :fetchpriority="isEager ? 'high' : undefined"
      :decoding="isEager ? 'sync' : 'async'"
      class="h-full w-full object-cover"
      :class="imgClass"
      @load="status = 'loaded'"
      @error="status = 'error'"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { HTMLAttributes } from 'vue';

/*
 * `hasVariants` yalnızca repodaki `public/img/**` görselleri için. Dönüştürme
 * betiği her kareyi `ad.webp` (tam) ve `ad-760.webp` (dar) olarak yazıyor, bu
 * bayrak srcset'i o adlandırmadan türetiyor. R2'den gelen ürün görsellerinde
 * varyant yok — orada kapalı bırakılmalı.
 */
interface IProps {
  src?: string | null;
  alt: string;
  ratio?: string;
  sizes?: string;
  imgClass?: HTMLAttributes['class'];
  isEager?: boolean;
  hasVariants?: boolean;
}

const props = withDefaults(defineProps<IProps>(), {
  src: null,
  ratio: undefined,
  sizes: undefined,
  imgClass: undefined,
  isEager: false,
  hasVariants: false,
});

const status = ref<'loading' | 'loaded' | 'error'>('loading');

const computedSrcset = computed(() => {
  if (!props.hasVariants || !props.src) return undefined;
  const narrow = props.src.replace(/\.webp$/, '-760.webp');
  if (narrow === props.src) return undefined;
  return `${narrow} 760w, ${props.src} 1298w`;
});

watch(
  () => props.src,
  (next) => {
    status.value = next ? 'loading' : 'error';
  },
  { immediate: true },
);
</script>
