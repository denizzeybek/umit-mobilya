<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-end items-center gap-2">
      <FSelect
        name="filterCategory"
        placeholder="Choose Category Name"
        :options="categoryTypeOptions"
        v-model="selectedFilter"
        class="!h-full"
      />
      <FInput
        name="filterName"
        v-model="typedName"
        placeholder="Enter Product Name"
      />
      <Button
        v-if="usersStore.isAuthenticated"
        label="Add Product"
        @click="showProductModal = true"
      />
    </div>
    <div
      v-if="productList?.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
    >
      <Card
        v-for="(product, idx) in productList"
        :key="product._id"
        @click="
          router.push({
            name: ERouteNames.ProductDetails,
            params: { id: product._id! },
          })
        "
        class="cursor-pointer"
      >
        <template #header>
          <Skeleton
            v-if="imageLoadingStates[product._id]"
            width="328px"
            height="180px"
          />
          <img
            v-else
            :src="product.imageUrl"
            class="w-full max-h-[180px]"
            alt="product image"
            @load="handleImageLoad(product._id)"
            @error="handleImageError(product._id)"
          />
        </template>
        <template #content>
          <ProductItemContent :product="product" />
        </template>
      </Card>
    </div>
    <div v-else class="flex justify-center items-center h-96">
      <Card class="flex items-center justify-center">
        <template #content>
          <span class="text-2xl">No products found</span>
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
import { onMounted, computed, ref, watch } from 'vue';
import { useProductsStore } from '@/stores/products';
import { ERouteNames } from '@/router/routeNames.enum';
import { useRouter } from 'vue-router';
import { useUsersStore } from '@/stores/users';
import ProductModal from '@/views/products/_modals/ProductModal.vue';
import ProductItemContent from '../_components/ProductItemContent.vue';
import { useCategoriesStore } from '@/stores/categories';
import { useFToast } from '@/composables/useFToast';
import type { IProductFilterDTO } from '@/interfaces/product/product.interface';

const usersStore = useUsersStore();
const categoriesStore = useCategoriesStore();
const productsStore = useProductsStore();
const router = useRouter();
const { showErrorMessage } = useFToast();

const isLoading = ref(false);
const showProductModal = ref(false);
const selectedFilter = ref({
  name: 'All Categories',
  value: null,
});
const typedName = ref();

// Her ürün için yükleme durumlarını takip etmek için bir obje
const imageLoadingStates = ref<Record<string, boolean>>({});

// Resim yüklenirken skeleton gösterimi için
const handleImageLoad = (id: string) => {
  imageLoadingStates.value[id] = false; // Yükleme tamamlandı
};

const handleImageError = (id: string) => {
  imageLoadingStates.value[id] = false; // Hata durumunda da skeleton kaldırılır
};

const productList = computed(() => {
  return productsStore.list;
});

const categoryTypeOptions = computed(() => {
  const categoriesList = categoriesStore.list?.map((category) => ({
    name: category.name,
    value: category._id,
  }));

  return [{ name: 'All Categories', value: null }, ...categoriesList];
});

const filterProducts = async () => {
  try {
    isLoading.value = true;
    const payload = {} as IProductFilterDTO;
    if (typedName.value) {
      payload.name = typedName.value;
    }
    if (selectedFilter.value.value) {
      payload.category = selectedFilter.value.value;
    }
    await productsStore.filter(payload);

    // Ürünler yüklendikten sonra tüm ürünler için yükleme durumunu true olarak ayarla
    productsStore.list?.forEach((product) => {
      imageLoadingStates.value[product._id!] = true;
    });

    setTimeout(() => {
      isLoading.value = false;
    }, 750);
  } catch (error: any) {
    showErrorMessage(error?.response?.data?.message as any);
  }
};

watch([selectedFilter, typedName], filterProducts, { immediate: true });

onMounted(async () => {
  await categoriesStore.fetch();
  productsStore.list?.forEach((product) => {
    imageLoadingStates.value[product._id!] = true;
  });
});
</script>
