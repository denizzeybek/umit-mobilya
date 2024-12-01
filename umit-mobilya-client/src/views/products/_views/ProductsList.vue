<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
    <Card
      v-for="(product, idx) in productList"
      :key="idx"
      @click="
        router.push({
          name: ERouteNames.ProductDetails,
          params: { id: product._id! },
        })
      "
      class="cursor-pointer"
    >
      <template #header>
        <img :src="product.imageUrl" alt="product image" />
      </template>
      <template #title>{{ product.name.toUpperCase() }}</template>
      <template #subtitle>{{
        `${product.price} ${product.currency}`
      }}</template>
      <template #content>
        <p class="m-0">
          {{ product.sizes }}
        </p>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useProductsStore } from '@/stores/products';
import { ERouteNames } from '@/router/routeNames.enum';
import { useRouter } from 'vue-router';

const productsStore = useProductsStore();
const router = useRouter();

const productList = computed(() => {
  return productsStore.list;
});

onMounted(() => {
  productsStore.fetch();
});
</script>

<style scoped></style>
