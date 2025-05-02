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
    <div v-if="product.sizes !== '0'" class="font-normal text-f-light-black">
      {{ product?.sizes }}
    </div>
    <Tag>
      <span class="uppercase">{{ product?.category?.name }}</span>
    </Tag>
  </div>
</template>

<script setup lang="ts">
import type {
  IProduct,
  IProductModule,
} from '@/interfaces/product/product.interface';
import { computed } from 'vue';

interface IProps {
  product: IProduct | IProductModule;
}

const props = defineProps<IProps>();

const productPrice = computed(() => {
  const product = props.product;
  let price = product?.price ?? 0;
  if ((product?.modules as any)?.length) {
    price =
      product?.modules?.reduce(
        (acc, module) => acc + Number(module.price) * Number(module.quantity),
        0,
      ) ?? 0;
  }
  return `${price} ${product?.currency}`;
});
</script>

<style scoped></style>
