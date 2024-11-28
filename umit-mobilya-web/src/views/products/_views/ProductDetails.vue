<template>
<ProductDetailLayout>
  <template #details>
    <ProductCarousel/>
  </template>
  <template #basket>
    <Basket />
  </template>
</ProductDetailLayout>
</template>

<script setup>
import { useRoute } from 'vue-router';
import ProductDetailLayout from '@/layouts/product/ProductDetailLayout.vue';
import Basket from '@/views/products/_components/Basket.vue';
import ProductCarousel from '@/views/products/_components/ProductCarousel.vue';

const route = useRoute();
</script>

<style lang="scss" scoped></style>
