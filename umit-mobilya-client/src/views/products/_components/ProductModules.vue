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
import { computed, watch, onMounted } from 'vue';
import { useProductsStore } from '@/stores/products';
import { useFieldArray, useForm } from 'vee-validate';
import { object, array, number } from 'yup';
import { useFToast } from '@/composables/useFToast';
import type { IProductModuleUpdateDTO } from '@/interfaces/product/product.interface';
import { useRoute } from 'vue-router';
import ProductItemContent from './ProductItemContent.vue';
import { useUsersStore } from '@/stores/users';

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

const { fields } = useFieldArray<any>('modules');
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

const submitHandler = handleSubmit(async (values) => {
  try {
    const modules = values.modules?.filter((module) => module.quantity > 0);
    const currentProduct = productsStore.currentProduct;
    const product = [
      {
        name: currentProduct.name,
        imageUrl: currentProduct.imageUrl,
        category: currentProduct.category,
        quantity: currentProduct.quantity,
        price: currentProduct.price,
        currency: currentProduct.currency,
      },
    ];
    const payload = [...product, ...modules];
    productsStore.setCurrentProductBasket(payload);
  } catch (error: any) {
    showErrorMessage(error?.response?.data?.message as any);
  }
});

const updateModules = async () => {
  try {
    if (!usersStore.isAuthenticated) return;
    const payload = {
      modules: modules.value.map((module) => ({
        productId: module.id,
        quantity: module.quantity,
      })),
    } as IProductModuleUpdateDTO;
    await productsStore.updateModule(productsStore.currentProduct._id, payload);
    await productsStore.find(route.params.id?.toString());
  } catch (error: any) {
    showErrorMessage(error?.response?.data?.message as any);
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
