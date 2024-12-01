<template>
  <Card>
    <template #content>
      <section class="relative">
        <div class="w-full max-w-7xl px-4 md:px-5 lg-6 mx-auto">
          <div class="flex justify-center">
            <FText as="h2" innerText="Shopping Cart" />
          </div>

          <div
            class="grid grid-cols-1 min-[550px]:gap-6 border-t border-gray-200 py-6"
          >
            <div
              class="flex items-center flex-col min-[550px]:flex-row gap-3 min-[550px]:gap-6 w-full max-xl:justify-center max-xl:max-w-xl max-xl:mx-auto"
            >
              <div class="img-box">
                <img
                  :src="currentProduct?.imageUrl"
                  alt="perfume bottle image"
                  class="xl:w-[140px] rounded-xl object-cover"
                />
              </div>
              <div class="flex items-start justify-between w-full max-w-sm">
                <div class="">
                  <h5
                    class="font-semibold uppercase text-xl leading-8 text-black max-[550px]:text-center"
                  >
                    {{ currentProduct?.name }}
                  </h5>
                  <p
                    class="font-normal text-lg leading-8 uppercase text-gray-500 my-2 min-[550px]:my-3 max-[550px]:text-center"
                  >
                    {{ currentProduct?.description }}
                  </p>
                </div>
                <Tag>
                  <span class="uppercase">{{ currentProduct?.category }}</span>
                </Tag>
              </div>
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
                <p class="font-normal text-xl leading-8 text-gray-400">
                  {{ product.name }}
                </p>
                <p class="font-normal text-xl leading-8 text-gray-400">
                  {{ product.quantity }}
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
          <div
            class="flex items-center flex-col sm:flex-row justify-center gap-3 mt-8"
          ></div>
        </div>
      </section>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { useProductsStore } from '@/stores/products';
import { computed } from 'vue';

interface IProps {
  hasModules: boolean;
}

defineProps<IProps>();

const productsStore = useProductsStore();

const currentProduct = computed(() => productsStore.currentProduct);
const products = computed(() => productsStore.currentProductBasket);
const total = computed(
  () =>
    `${productsStore.currentProductTotal?.price} ${productsStore.currentProductTotal?.currency}`,
);
</script>

<style scoped></style>
