<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col lg:flex-row justify-between items-center gap-2">
      <FText as="h1" :innerText="pageTitle" />
      <!-- <FSelect
        name="filterCategory"
        placeholder="Kategori Adı Seçin"
        :options="categoryTypeOptions"
        v-model="selectedFilter"
        class="!h-full"
      /> -->
      <div class="flex items-center gap-2">
        <FInput
          v-model="typedName"
          name="filterName"
          placeholder="Ürün ismi girin"
        />
        <Button
          v-if="usersStore.isAuthenticated"
          label="Ürün Ekle"
          @click="showProductModal = true"
        />
      </div>
    </div>
    <template v-if="isLoading">
      <div class="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:gap-6">
        <Skeleton v-for="j in 3" :key="j" class="!w-full !h-[22rem] lg:w-1/3" />
      </div>
    </template>
    <div
      v-else-if="productList?.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
    >
      <Card
        v-for="product in productList"
        :key="product._id"
        class="cursor-pointer min-h-[320px]"
        @click="
          router.push({
            name: ERouteNames.ProductDetails,
            params: { id: product._id! },
          })
        "
      >
        <template #header>
          <div class="flex items-center justify-center">
            <img
              :src="product.imageUrl"
              class="w-auto h-[180px]"
              alt="product image"
            />
          </div>
        </template>
        <template #content>
          <ProductItemContent :product="product" />
        </template>
      </Card>
    </div>
    <div v-else class="flex justify-center items-center h-96">
      <Card class="flex items-center justify-center">
        <template #content>
          <span class="text-2xl">Ürünler Bulunamadı</span>
        </template>
      </Card>
    </div>
  </div>
  <ProductModal
    v-if="showProductModal"
    v-model:open="showProductModal"
    @fetchProducts="filterProducts"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute,useRouter } from 'vue-router';

import { useFToast } from '@/composables/useFToast';
import { ERouteNames } from '@/router/routeNames.enum';
import { useCategoriesStore } from '@/stores/categories';
import { useProductsStore } from '@/stores/products';
import { useUsersStore } from '@/stores/users';
import ProductModal from '@/views/products/_modals/ProductModal.vue';

import ProductItemContent from '../_components/ProductItemContent.vue';

import type { IProductFilterDTO } from '@/interfaces/product/product.interface';

const usersStore = useUsersStore();
const categoriesStore = useCategoriesStore();
const productsStore = useProductsStore();
const router = useRouter();
const route = useRoute();
const { showErrorMessage } = useFToast();

const isLoading = ref(false);
const showProductModal = ref(false);
const selectedFilter = ref({
  name: 'Tüm Categoriler',
  value: null,
});
const typedName = ref();

const productList = computed(() => {
  return productsStore.list;
});

const categoryTypeOptions = computed(() => {
  const categoriesList = categoriesStore.list?.map((category) => ({
    name: category.name,
    value: category._id,
  }));

  return [{ name: 'Tüm Categoriler', value: null }, ...categoriesList];
});

const currentCategory = computed(() => {
  return categoryTypeOptions.value.find(
    (category) => category.value === route?.query?.categoryId,
  );
});

const pageTitle = computed(() => {
  if (currentCategory.value?.name) {
    return `${currentCategory.value?.name} Ürüleri`;
  }
  return '';
});

const filterProducts = async () => {
  try {
    isLoading.value = true;
    const payload = {} as IProductFilterDTO;
    if (typedName.value) {
      payload.name = typedName.value;
    }
    if (route.query.categoryId) {
      payload.category = route.query.categoryId?.toString();
    }
    if (selectedFilter.value.value) {
      payload.category = selectedFilter.value.value;
    }
    await productsStore.filter(payload);
    isLoading.value = false;
  } catch (error: any) {
    showErrorMessage(error?.response?.data?.message as any);
  }
};

watch([selectedFilter, typedName], filterProducts);

watch(
  () => route.fullPath,
  () => {
    filterProducts();
  },
  { immediate: true },
);

onMounted(async () => {
  await categoriesStore.fetch();
});
</script>
