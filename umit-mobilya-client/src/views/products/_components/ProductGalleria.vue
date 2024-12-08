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
    </template>
  </Card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useProductsStore } from '@/stores/products';

const productsStore = useProductsStore();

const productImages = computed(() => {
  return [
    ...[productsStore.currentProduct?.imageUrl],
    ...productsStore.currentProduct?.imageListUrls,
  ] || [];
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
