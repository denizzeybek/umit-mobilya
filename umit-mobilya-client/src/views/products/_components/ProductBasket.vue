<template>
  <Card>
    <template #content>
      <section class="relative">
        <div
          class="w-full max-w-7xl px-4 md:px-5 lg-6 mx-auto flex flex-col gap-4"
        >
          <div class="grid grid-cols-1 min-[550px]:gap-6 rounded-xl py-6">
            <div
              :class="modules?.length ? '' : ''"
              class="flex items-center flex-col min-[550px]:flex-row gap-3 min-[550px]:gap-6 w-full max-xl:justify-center max-xl:max-w-xl max-xl:mx-auto"
            >
              <img
                :src="currentProduct?.imageUrl"
                alt="perfume bottle image"
                class="w-auto h-[100px] rounded-md object-cover"
              />
              <ProductItemContent :product="currentProduct" />
            </div>
          </div>
          <div
            class="bg-gray-50 rounded-xl p-6 w-full mb-8 max-lg:max-w-xl max-lg:mx-auto"
          >
            <template v-if="hasModules">
              <div
                v-for="(product, idx) in products"
                :keey="idx"
                class="flex items-center justify-between w-full mb-6"
              >
                <p
                  class="uppercase w-[80px] font-normal text-xl leading-8 text-gray-400"
                >
                  {{ product.name }}
                </p>
                <p class="font-normal text-xl leading-8 text-gray-400">
                  {{
                    `${product.quantity} x ${product.price} ${product.currency}`
                  }}
                </p>
                <h6 class="font-semibold text-xl leading-8 text-gray-900">
                  {{
                    `${product.price * product.quantity} ${product.currency}`
                  }}
                </h6>
              </div>
            </template>
            <div class="flex items-center justify-between w-full py-6">
              <p
                class="font-manrope font-medium text-2xl leading-9 text-gray-900"
              >
                Total
              </p>
              <h6
                class="font-manrope font-medium text-2xl leading-9 text-indigo-500"
              >
                {{
                  hasModules
                    ? total
                    : `${currentProduct?.price} ${currentProduct?.currency}`
                }}
              </h6>
            </div>
          </div>
        </div>
      </section>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { useProductsStore } from '@/stores/products';
import { computed } from 'vue';
import ProductItemContent from './ProductItemContent.vue';

interface IProps {
  hasModules: boolean;
}

defineProps<IProps>();

const productsStore = useProductsStore();

const currentProduct = computed(() => productsStore.currentProduct);
const modules = computed(() => productsStore.currentProduct?.modules);
const products = computed(() => productsStore.currentProductBasket);
const total = computed(
  () =>
    `${productsStore.currentProductTotal?.price} ${productsStore.currentProductTotal?.currency}`,
);
</script>

<style scoped></style>
