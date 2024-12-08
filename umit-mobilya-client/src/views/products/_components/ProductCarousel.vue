<template>
  <Card>
    <template #content>
      <Galleria
        :value="productImages"
        :responsiveOptions="responsiveOptions"
        :numVisible="5"
      >
        <template #item="slotProps">
          <img
            :src="slotProps.item"
            alt="slotProps.item.alt"
            style="width: 100%"
          />
        </template>
        <template #thumbnail="slotProps">
          <img
            :src="slotProps.item"
            alt="slotProps.item.alt"
            class="!max-h-[100px]"
          />
        </template>
      </Galleria>

      <!-- <Carousel
        :value="productImages"
        :numVisible="1"
        :numScroll="1"
        :responsiveOptions="responsiveOptions"
        circular
        :autoplayInterval="7000"
      >
        <template #item="slotProps">
          <div
            class="border border-surface-200 dark:border-surface-700 rounded m-2 p-4"
          >
            <div class="relative mx-auto">
              <img
                :src="slotProps.data.image"
                alt="product-detail"
                class="w-full rounded-md lg:h-[530px]"
              />
            </div>
          </div>
        </template>
      </Carousel> -->
    </template>
  </Card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useProductsStore } from '@/stores/products';

const productsStore = useProductsStore();

const productImages = computed(() => {
  return productsStore.currentProduct?.imageListUrls;
});

const responsiveOptions = ref([
  {
    breakpoint: '1400px',
    numVisible: 2,
  },
  {
    breakpoint: '1199px',
    numVisible: 3,
  },
  {
    breakpoint: '767px',
    numVisible: 2,
  },
  {
    breakpoint: '575px',
    numVisible: 1,
  },
]);
</script>
