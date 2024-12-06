<template>
  <div class="flex flex-col items-start justify-between gap-1 w-full max-w-sm">
    <div
      class="font-semibold uppercase text-xl leading-8 text-black max-[550px]:text-center"
    >
      {{ product?.name }}
    </div>
    <div class="font-semibold text-black">
      {{ `${product?.price} ${product?.currency}` }}
    </div>
    <div class="font-normal text-f-light-black">
      {{ product?.sizes }}
    </div>
    <Tag>
      <span class="uppercase">{{ product?.category?.name }}</span>
    </Tag>
  </div>
</template>

<script setup lang="ts">
import type { IProduct, IProductModule } from '@/interfaces/product/product.interface';

interface IProps {
  product: IProduct | IProductModule;
}

defineProps<IProps>();
</script>

<style scoped></style>
