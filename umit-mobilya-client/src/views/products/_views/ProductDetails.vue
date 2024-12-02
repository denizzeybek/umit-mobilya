<template>
  <ProductDetailLayout>
    <template #breadcrumb>
      <ProductHeader @handleUpdateModal="isUpdateModalOpen=true"/>
    </template>
    <template #details>
      <div class="flex flex-col gap-4">
        <ProductCarousel />
        <ProductModules v-if="hasModules" :key="updateKey"/>
      </div>
    </template>
    <template #basket>
      <ProductBasket :hasModules="hasModules" />
    </template>
  </ProductDetailLayout>
  <UpdateModulesModal
    v-if="isUpdateModalOpen"
    v-model:open="isUpdateModalOpen"
  />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import ProductDetailLayout from '@/layouts/product/ProductDetailLayout.vue';
import ProductBasket from '@/views/products/_components/ProductBasket.vue';
import ProductCarousel from '@/views/products/_components/ProductCarousel.vue';
import ProductHeader from '@/views/products/_components/ProductHeader.vue';
import ProductModules from '@/views/products/_components/ProductModules.vue';
import UpdateModulesModal from '@/views/products/_modals/UpdateModulesModal.vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useProductsStore } from '@/stores/products';

const productsStore = useProductsStore();
const route = useRoute();

const isUpdateModalOpen = ref(false);
const updateKey = ref(0);

const hasModules = computed(
  () => productsStore?.currentProduct?.modules?.length > 0,
);

const fetchProductsList = async () => {
  await productsStore.fetch();
};
const fetchProduct = async () => {
  await productsStore.find(route.params.id?.toString());
  updateKey.value++;
};


watch(
  isUpdateModalOpen,
  (newVal, oldVal) => {
    if (oldVal === true && newVal === false) {
      fetchProduct();
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await fetchProductsList()
  await fetchProduct()
});
</script>

<style lang="scss" scoped></style>
