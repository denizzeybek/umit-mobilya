<template>
  <Card>
    <template #content>
      <Galleria
        v-if="productsStore.currentProduct?.imageUrlList?.length"
        :value="productImages"
        :responsiveOptions="responsiveOptions"
        :numVisible="5"
      >
        <template #item="slotProps">
          <div class="flex items-center justify-center">
            <img
              :src="slotProps.item"
              alt="slotProps.item.alt"
              class="w-auto h-[450px]"
            />
          </div>
        </template>
        <template #thumbnail="slotProps">
          <img
            :src="slotProps.item"
            alt="slotProps.item.alt"
            class="w-auto !h-[100px]"
          />
        </template>
      </Galleria>

      <div v-else class="flex items-center justify-center">
        <img
          :src="productsStore.currentProduct?.imageUrl"
          alt="slotProps.item.alt"
          class="w-auto h-[450px]"
        />
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useProductsStore } from '@/stores/products';

const productsStore = useProductsStore();

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

const productImages = computed(() => {
  return (
    [
      ...[productsStore.currentProduct?.imageUrl],
      ...productsStore.currentProduct?.imageUrlList,
    ] || []
  );
});
</script>
