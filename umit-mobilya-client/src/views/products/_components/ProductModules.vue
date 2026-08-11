<template>
  <Card>
    <template #content>
      <DataView :value="fields" dataKey="_id">
        <template #list="slotProps">
          <div class="flex flex-col">
            <div v-for="(item, idx) in slotProps.items" :key="idx">
              <div
                class="flex flex-col sm:flex-row sm:items-center p-6 gap-4"
                :class="{
                  'border-t border-surface-200 dark:border-surface-700':
                    idx !== 0,
                }"
              >
                <div class="md:w-40 relative">
                  <img
                    class="block xl:block mx-auto rounded-md w-full sm:w-80"
                    :src="item?.value?.imageUrl"
                    :alt="item?.value?.name"
                  />
                </div>
                <div
                  class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6"
                >
                  <ProductItemContent :product="item.value" />
                  <div class="flex flex-col md:items-end gap-8 max-w-fit">
                    <FInput
                      :name="`modules[${idx}].quantity`"
                      :showAdjustmentButtons="true"
                      :isReturnNumber="true"
                      :disabled="true"
                      customClass="!w-11"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataView>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted,watch } from 'vue';
import { useRoute } from 'vue-router';

import { useFieldArray, useForm } from 'vee-validate';
import { array, number,object } from 'yup';

import { useFToast } from '@/composables/useFToast';
import { useProductsStore } from '@/stores/products';
import { useUsersStore } from '@/stores/users';

import ProductItemContent from './ProductItemContent.vue';

import type {
  CategoryResponseDto,
  ProductModuleResponseDto,
} from '@/client';

const { showErrorMessage } = useFToast();
const route = useRoute();
const usersStore = useUsersStore();
const productsStore = useProductsStore();

const validationSchema = object({
  modules: array()
    .of(
      object().shape({
        quantity: number().required().label('Quantity'),
      }),
    )
    .strict()
    .required(),
});

const { handleSubmit, resetForm, defineField } = useForm({
  validationSchema,
});

/*
 * The row the form edits: a module flattened for display plus the id needed to
 * send it back. vee-validate cannot infer it from the yup schema, which only
 * describes `quantity`.
 */
interface IModuleRow {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  quantity: number;
  sizes?: string;
  category?: CategoryResponseDto;
}

const { fields } = useFieldArray<IModuleRow>('modules');
const [modules] = defineField('modules');

const getInitialFormData = computed(() => {
  return productsStore.currentProduct?.modules?.map((module) => {
    return {
      name: module.name,
      imageUrl: module.imageUrl,
      category: module.category,
      quantity: module.quantity,
      price: module?.price,
      sizes: module?.sizes,
      currency: module?.currency,
      id: module._id,
    };
  });
});

/*
 * The basket is the base product plus every module with a quantity, both in
 * the same shape, so the total is one reduce and ProductItemContent renders
 * either without knowing which it got.
 */
const submitHandler = handleSubmit((values) => {
  const currentProduct = productsStore.currentProduct;
  if (!currentProduct) return;

  const base: ProductModuleResponseDto = {
    _id: currentProduct._id,
    name: currentProduct.name,
    price: currentProduct.price,
    currency: currentProduct.currency,
    imageUrl: currentProduct.imageUrl,
    quantity: currentProduct.quantity,
    sizes: currentProduct.sizes,
    description: currentProduct.description,
    category: currentProduct.category,
  };

  const rows = (values.modules ?? []) as IModuleRow[];
  const selected: ProductModuleResponseDto[] = rows
    .filter((module) => module.quantity > 0)
    .map((module) => ({
      _id: module.id,
      name: module.name,
      price: module.price,
      currency: module.currency,
      imageUrl: module.imageUrl,
      quantity: module.quantity,
      sizes: module.sizes,
      category: module.category,
    }));

  productsStore.setCurrentProductBasket([base, ...selected]);
});

const updateModules = async () => {
  const currentProduct = productsStore.currentProduct;
  if (!usersStore.isAuthenticated || !currentProduct) return;

  try {
    await productsStore.updateModules(currentProduct._id, {
      modules: (modules.value as IModuleRow[]).map((module) => ({
        productId: module.id,
        quantity: module.quantity,
      })),
    });
    await productsStore.find(route.params.id?.toString());
  } catch (error) {
    showErrorMessage(error);
  }
};

watch(
  () => [modules.value],
  () => {
    if (!productsStore.currentProduct?.modules?.length) return;
    submitHandler();
    updateModules();
  },
  { immediate: false, deep: true },
);

onMounted(() => {
  resetForm({
    values: {
      modules: getInitialFormData.value,
    },
  });
});
</script>
