<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
    <div
      v-for="(product, idx) in productList"
      :key="idx"
      class="group flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-md"
    >
      <RouterLink
        :to="{ name: ERouteNames.ProductDetails, params: { id: product._id! } }"
        class="relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl"
      >
      <img
          class="peer absolute top-0 right-0 h-full w-full object-cover"
          :src="product.imageUrl"
          alt="product image"
        />
    </RouterLink>
      <div class="mt-4 px-5 pb-5">
        <a href="#">
          <h5 class="text-xl tracking-tight text-slate-900">
            {{ product.name.toUpperCase() }}
          </h5>
        </a>
        <div class="mt-2 mb-5 flex items-center justify-between">
          <div>
            <div class="text-3xl font-bold text-slate-900">
              {{ `${product.price} ${product.currency}` }}
            </div>
            <div class="text-sm text-slate-900">{{ product.sizes }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useProductsStore } from '@/stores/products';
import {ERouteNames} from '@/router/routeNames.enum';
const productsStore = useProductsStore();

const productList = computed(() => {
  return productsStore.list;
});

onMounted(() => {
  productsStore.fetch();
});
</script>

<style scoped></style>
