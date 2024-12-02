<template>
  <div class="flex flex-col gap-4">
    <Card>
      <template #content>
        <div class="w-full flex justify-end">
          <Button
            v-if="usersStore.isAuthenticated"
            label="Add Product"
            @click="showProductModal = true"
          />
        </div>
      </template>
    </Card>
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
        <template #title>{{ product?.name?.toUpperCase() }}</template>
        <template #subtitle>{{
          `${product?.totalPrice} ${product?.currency}`
        }}</template>
        <template #content>
          <p class="m-0">
            {{ product?.sizes }}
          </p>
        </template>
      </Card>
    </div>
  </div>
  <ProductModal
    v-if="showProductModal"
    v-model:open="showProductModal"
    @fetchProducts="fetchProducts"
  />
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useProductsStore } from '@/stores/products';
import { ERouteNames } from '@/router/routeNames.enum';
import { useRouter } from 'vue-router';
import { useUsersStore } from '@/stores/users';
import ProductModal from '@/views/products/_modals/ProductModal.vue';

const usersStore = useUsersStore();
const productsStore = useProductsStore();
const router = useRouter();

const showProductModal = ref(false);

const productList = computed(() => {
  return productsStore.list;
});

const fetchProducts = async () => {
  await productsStore.fetch();
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped></style>
