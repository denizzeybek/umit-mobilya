<template>
  <div class="flex w-full flex-col items-start gap-1.5">
    <p v-if="product?.category?.name" class="eyebrow">
      {{ product.category.name }}
    </p>
    <h3 class="display text-xl text-f-ink">
      {{ product?.name }}
    </h3>
    <p v-if="product?.sizes && product.sizes !== '0'" class="text-sm text-f-ink-faint">
      {{ product.sizes }}
    </p>
    <p class="text-sm text-f-ink-muted">
      {{ productPrice }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type {
  ProductModuleResponseDto,
  ProductResponseDto,
} from '@/client';

interface IProps {
  product: ProductResponseDto | ProductModuleResponseDto | null;
}

const props = defineProps<IProps>();

/*
 * Takes either shape the API returns. A full product carries `modules` and its
 * price is the sum of them; a flattened module never does, and its own price is
 * already the whole story.
 */
const productPrice = computed(() => {
  const product = props.product;
  const modules =
    product && 'modules' in product ? product.modules : undefined;

  const price = modules?.length
    ? modules.reduce(
        (total, module) => total + module.price * module.quantity,
        0,
      )
    : (product?.price ?? 0);

  return `${new Intl.NumberFormat('tr-TR').format(price)} ${product?.currency ?? ''}`.trim();
});
</script>

<style scoped></style>
