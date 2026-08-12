<template>
  <section>
    <div class="border-b border-f-rule pb-5">
      <p class="eyebrow">Kurulum</p>
      <h2 class="display mt-4 text-display-sm text-f-ink">
        Bu iş şu modüllerden oluşuyor
      </h2>
    </div>

    <ol class="flex flex-col">
      <li
        v-for="(item, idx) in fields"
        :key="item.key"
        class="flex flex-col gap-5 border-b border-f-rule py-6 sm:flex-row sm:items-center"
      >
        <span class="index-numeral shrink-0 text-sm text-f-brass">
          {{ String(idx + 1).padStart(2, '0') }}
        </span>

        <div class="w-full shrink-0 sm:w-32">
          <FImage
            :src="item.value.imageUrl"
            :alt="item.value.name"
            ratio="4 / 3"
          />
        </div>

        <div class="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div class="min-w-0 flex-1">
            <ProductItemContent :product="toModuleDto(item.value)" />
          </div>

          <FInput
            :name="`modules[${idx}].quantity`"
            :showAdjustmentButtons="true"
            :isReturnNumber="true"
            :disabled="true"
            customClass="!w-11"
          />
        </div>
      </li>
    </ol>
  </section>
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
 * Form satırı ile API şekli arasındaki tek fark anahtar adı: satır `id`
 * tutuyor, DTO `_id`. Hem sepet hem de listede aynı dönüşüm gerektiği için
 * tek yerde duruyor.
 */
const toModuleDto = (row: IModuleRow): ProductModuleResponseDto => ({
  _id: row.id,
  name: row.name,
  price: row.price,
  currency: row.currency,
  imageUrl: row.imageUrl,
  quantity: row.quantity,
  sizes: row.sizes,
  category: row.category,
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
    .map(toModuleDto);

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
