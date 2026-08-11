<template>
  <div class="flex flex-col items-start justify-between gap-1 w-full max-w-sm">
    <div
      class="font-semibold uppercase text-xl leading-8 text-black max-[550px]:text-center"
    >
      {{ product?.name }}
    </div>
    <div class="font-semibold text-black">
      {{ productPrice }}
    </div>
    <div v-if="product?.sizes !== '0'" class="font-normal text-f-light-black">
      {{ product?.sizes }}
    </div>
    <Tag>
      <span class="uppercase">{{ product?.category?.name }}</span>
    </Tag>
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

  return `${price} ${product?.currency ?? ''}`;
});
</script>

<style scoped></style>
