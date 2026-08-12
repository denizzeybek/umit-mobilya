<template>
  <div class="flex flex-col gap-3">
    <div class="grain relative overflow-hidden bg-f-linen">
      <FImage
        :src="activeImage"
        :alt="productsStore.currentProduct?.name ?? 'Ürün görseli'"
        ratio="4 / 3"
        sizes="(min-width: 1024px) 62vw, 100vw"
        is-eager
      />
    </div>

    <div v-if="images.length > 1" class="flex flex-wrap gap-3">
      <button
        v-for="(image, index) in images"
        :key="image"
        type="button"
        class="w-20 overflow-hidden border-2 transition-colors duration-300 sm:w-24"
        :class="
          image === activeImage
            ? 'border-f-primary'
            : 'border-transparent hover:border-f-rule-strong'
        "
        :aria-label="`Görsel ${index + 1}`"
        :aria-current="image === activeImage"
        @click="activeImage = image"
      >
        <FImage :src="image" :alt="`Görsel ${index + 1}`" ratio="1 / 1" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useProductsStore } from '@/stores/products';

const productsStore = useProductsStore();

const activeImage = ref<string | null>(null);

const images = computed<string[]>(() => {
  const product = productsStore.currentProduct;
  return [product?.imageUrl, ...(product?.imageUrlList ?? [])].filter(
    (url): url is string => !!url,
  );
});

watch(
  images,
  (next) => {
    if (!next.includes(activeImage.value ?? '')) {
      activeImage.value = next[0] ?? null;
    }
  },
  { immediate: true },
);
</script>
