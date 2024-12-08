<template>
  <ProductDetailLayout>
    <template #breadcrumb>
      <ProductHeader
        @handleUpdateModal="showUpdateModal = true"
        @handleUpdateProduct="showProductModal = true"
        @handleImagesModal="showProductImagesModal = true"
        @handleEditImagesModal="showProductEditImagesModal = true"
      />
    </template>
    <template #details>
      <div class="flex flex-col gap-4">
        <ProductGalleria />
        <ProductModules v-if="hasModules" :key="updateKey" />
      </div>
    </template>
    <template #basket>
      <ProductBasket :hasModules="hasModules" />
    </template>
  </ProductDetailLayout>
  <UpdateModulesModal v-if="showUpdateModal" v-model:open="showUpdateModal" />
  <ProductModal
    v-if="showProductModal"
    v-model:open="showProductModal"
    :data="productsStore.currentProduct"
    @fetchProducts="fetchAll"
  />
  <ProductImagesModal
    v-if="showProductImagesModal"
    v-model:open="showProductImagesModal"
    @fetchProducts="fetchAll"
  />
  <ProductEditImagesModal
    v-if="showProductEditImagesModal"
    v-model:open="showProductEditImagesModal"
    @fetchProducts="fetchAll"
  />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useProductsStore } from '@/stores/products';
import { computed, onMounted, ref, watch } from 'vue';
import ProductDetailLayout from '@/layouts/product/ProductDetailLayout.vue';
import ProductBasket from '@/views/products/_components/ProductBasket.vue';
import ProductGalleria from '@/views/products/_components/ProductGalleria.vue';
import ProductHeader from '@/views/products/_components/ProductHeader.vue';
import ProductModules from '@/views/products/_components/ProductModules.vue';
import ProductModal from '@/views/products/_modals/ProductModal.vue';
import ProductImagesModal from '@/views/products/_modals/ProductImagesModal.vue';
import UpdateModulesModal from '@/views/products/_modals/UpdateModulesModal.vue';
import ProductEditImagesModal from '@/views/products/_modals/ProductEditImagesModal.vue';

const productsStore = useProductsStore();
const route = useRoute();

const showProductModal = ref(false);
const showProductImagesModal = ref(false);
const showUpdateModal = ref(false);
const showProductEditImagesModal = ref(false);
const updateKey = ref(0);

const hasModules = computed(
  () => productsStore?.currentProduct?.modules?.length > 0,
);

const fetchProducts = async () => {
  await productsStore.fetch();
};

const fetchProduct = async () => {
  await productsStore.find(route.params.id?.toString());
  updateKey.value++;
};

const fetchAll = async () => {
  await fetchProducts();
  await fetchProduct();
};

watch(
  showUpdateModal,
  (newVal, oldVal) => {
    if (oldVal === true && newVal === false) {
      fetchProduct();
    }
  },
  { immediate: true },
);

onMounted(() => {
  fetchAll();
});
</script>

<style lang="scss" scoped></style>
