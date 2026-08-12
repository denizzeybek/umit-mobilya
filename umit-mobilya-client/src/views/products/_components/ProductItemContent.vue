<template>
  <div class="flex w-full flex-col items-start gap-1.5">
    <p v-if="product?.category?.name" class="eyebrow">
      {{ product.category.name }}
    </p>

    <h3 class="display text-xl text-f-ink">
      {{ product?.name }}
    </h3>

    <p
      v-if="product?.sizes && product.sizes !== '0'"
      class="text-sm text-f-ink-faint"
    >
      {{ product.sizes }}
    </p>

    <p v-if="product?.description" class="text-sm text-f-ink-muted">
      {{ product.description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ProductResponseDto } from '@/client';

/**
 * Fiyat satırı KALDIRILDI: portfolyo artık fiyat göstermiyor. Ismarlama
 * üretimde vitrindeki sabit bir rakam, konfigüratörün ölçüden ürettiği gerçek
 * fiyatla çelişirdi ve iki ayrı fiyat kavramı doğardı.
 */
interface IProps {
  product: ProductResponseDto | null;
}

defineProps<IProps>();
</script>
