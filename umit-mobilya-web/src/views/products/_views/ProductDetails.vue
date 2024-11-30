<template>
  <ProductDetailLayout>
    <template #breadcrumb>
      <Card>
        <template #content>
          <ProductHeader />
        </template>
      </Card>
    </template>
    <template #details>
      <div class="flex flex-col gap-4">
      <Card>
        <template #content>
          <ProductCarousel />
        </template>
      </Card>
      <Card>
        <template #content>
          <ProductModules />
        </template>
      </Card>
    </div>
    </template>
    <template #basket>
      <Card>
        <template #content>
          <ProductBasket />
        </template>
      </Card>
    </template>
  </ProductDetailLayout>
</template>

<script setup>
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

onMounted(() => {
  productsStore.find(route.params.id);
  console.log(route.params.id);
});
</script>

<style lang="scss" scoped></style>
