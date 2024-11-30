<template>
  <ProductDetailLayout>
    <template #breadcrumb>
      <ProductHeader />
    </template>
    <template #details>
      <div class="flex flex-col gap-4">
        <ProductCarousel />
        <ProductModules v-if="productsStore.currentProduct?.modules?.length" />
      </div>
    </template>
    <template #basket>
      <ProductBasket />
    </template>
  </ProductDetailLayout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import ProductDetailLayout from '@/layouts/product/ProductDetailLayout.vue';
import ProductBasket from '@/views/products/_components/ProductBasket.vue';
import ProductCarousel from '@/views/products/_components/ProductCarousel.vue';
import ProductHeader from '@/views/products/_components/ProductHeader.vue';
import ProductModules from '@/views/products/_components/ProductModules.vue';
import { onMounted } from 'vue';
import { useProductsStore } from '@/stores/products';

const productsStore = useProductsStore();
const route = useRoute();

onMounted(async () => {
  await productsStore.find(route.params.id?.toString());
});
</script>

<style lang="scss" scoped></style>
