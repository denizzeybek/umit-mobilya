<template>
  <ProductDetailLayout>
    <template #breadcrumb>
      <ProductHeader
        @handleUpdateProduct="showProductModal = true"
        @handleImagesModal="showProductImagesModal = true"
        @handleEditImagesModal="showProductEditImagesModal = true"
      />
    </template>
    <template #details>
      <Skeleton v-if="isLoading" class="!h-[28rem] !w-full" />
      <div v-else class="flex flex-col gap-14">
        <ProductGalleria />
      </div>
    </template>
    <template #basket>
      <Skeleton v-if="isLoading" class="!h-[26rem] !w-full" />
      <ProductCta v-else :preset="productsStore.currentProduct?.configuratorPreset" />
    </template>
  </ProductDetailLayout>
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
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useFToast } from '@/composables/useFToast';
import ProductDetailLayout from '@/layouts/product/ProductDetailLayout.vue';
import { useProductsStore } from '@/stores/products';
import ProductCta from '@/views/products/_components/ProductCta.vue';
import ProductGalleria from '@/views/products/_components/ProductGalleria.vue';
import ProductHeader from '@/views/products/_components/ProductHeader.vue';
import ProductEditImagesModal from '@/views/products/_modals/ProductEditImagesModal.vue';
import ProductImagesModal from '@/views/products/_modals/ProductImagesModal.vue';
import ProductModal from '@/views/products/_modals/ProductModal.vue';

const productsStore = useProductsStore();
const route = useRoute();
const { showErrorMessage } = useFToast();

const showProductModal = ref(false);
const showProductImagesModal = ref(false);
const showProductEditImagesModal = ref(false);
const isLoading = ref(false);

const fetchProducts = async () => {
  await productsStore.fetch();
};

const fetchProduct = async () => {
  await productsStore.find(route.params.id?.toString());
};

const fetchAll = async () => {
  isLoading.value = true;
  try {
    await fetchProduct();
    await fetchProducts();
  } catch (error) {
    showErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchAll();
});
</script>

<style lang="scss" scoped></style>
