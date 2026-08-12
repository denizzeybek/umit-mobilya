<template>
  <RouterLink
    :to="{ name: ERouteNames.ProductDetails, params: { id: product._id! } }"
    class="group flex flex-col"
  >
    <div class="overflow-hidden bg-f-linen">
      <FImage
        :src="product.imageUrl"
        :alt="product.name"
        ratio="4 / 3"
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        img-class="transition-transform duration-[1200ms] ease-editorial group-hover:scale-105"
      />
    </div>

    <div class="mt-5 flex items-baseline gap-4">
      <span class="index-numeral text-sm text-f-brass">
        {{ String(index + 1).padStart(2, '0') }}
      </span>

      <div class="min-w-0 flex-1">
        <h2
          class="display truncate text-2xl text-f-ink transition-colors duration-300 group-hover:text-f-primary"
        >
          {{ product.name }}
        </h2>
        <p class="mt-1 text-sm text-f-ink-muted">
          <span v-if="product.category?.name">{{ product.category.name }}</span>
          <span v-if="hasSizes" class="text-f-ink-faint">
            · {{ product.sizes }}
          </span>
        </p>
      </div>
    </div>

  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { ERouteNames } from '@/router/routeNames.enum';

import type { ProductResponseDto } from '@/client';

interface IProps {
  product: ProductResponseDto;
  index: number;
}

const props = defineProps<IProps>();

const hasSizes = computed(
  () => Boolean(props.product.sizes) && props.product.sizes !== '0',
);

/*
 * Modüllü bir ürünün fiyatı modüllerin toplamı; modülsüz ürünün kendi fiyatı
 * zaten tam hikâye. ProductItemContent'te de aynı kural geçerli.
 */
</script>
