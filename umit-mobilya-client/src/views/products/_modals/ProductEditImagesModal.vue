<template>
  <Dialog
    v-model:visible="open"
    modal
    header="Images Gallery"
    class="!bg-f-secondary-purple"
    :style="{ width: '50rem' }"
  >
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 rounded-md gap-8 my-5"
    >
      <template v-for="(image, idx) in imagesList" :key="idx">
        <div class="relative inline-block">
          <img
            class="rounded-md sm:w-80 w-full max-h-[180px] min-h-[90px]"
            :src="image.url"
            :alt="image.name"
          />
          <Button
            rounded
            severity="danger"
            class="!absolute -top-4 right-6"
            icon="pi pi-times"
            @click="removeImage(image.name)"
          />
        </div>
      </template>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useFToast } from '@/composables/useFToast';
import { useProductsStore } from '@/stores/products';
import { useRoute } from 'vue-router';
import type { IProductDeleteImageDTO } from '@/interfaces/product/product.interface';

const productsStore = useProductsStore();
const route = useRoute();

const open = defineModel<boolean>('open');
const { showSuccessMessage, showErrorMessage } = useFToast();

const imagesList = computed(() => {
  const currentProduct = productsStore.currentProduct;

  if (
    !currentProduct ||
    !currentProduct.imageUrlList?.length ||
    !currentProduct.imageNameList?.length
  ) {
    return [];
  }

  return currentProduct.imageNameList.map((name, idx) => {
    const url = currentProduct.imageUrlList?.[idx];
    return {
      name,
      url: url ?? '',
    };
  });
});

const removeImage = async (imageName: string) => {
  try {
    const payload = {
      id: route.params.id,
      imageName,
    } as IProductDeleteImageDTO;
    await productsStore.deleteImage(payload);
    await productsStore.find(route.params.id?.toString());
    showSuccessMessage('Resim Galeriden Kaldırıldı');
  } catch (error) {
    showErrorMessage('Resmi silerken hata oluştu');
  }
};
</script>
