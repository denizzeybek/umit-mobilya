<template>
  <Card>
    <template #content>
      <DataView :value="fields" dataKey="modules">
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
                    class="block xl:block mx-auto rounded w-full"
                    :src="item?.value?.imageUrl"
                    :alt="item?.value?.name"
                  />
                </div>
                <div
                  class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6"
                >
                  <div
                    class="flex flex-row md:flex-col justify-between items-start gap-2"
                  >
                    <div>
                      <Tag>
                        <span class="uppercase">{{
                          item?.value?.category
                        }}</span>
                      </Tag>

                      <div class="text-lg font-medium mt-2 uppercase">
                        {{ item?.value?.name }}
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col md:items-end gap-8 max-w-fit">
                    <FInputNumber :name="`modules[${idx}].quantity`" />
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
import { string, object, array, number } from 'yup';
import { useFToast } from '@/composables/useFToast';

const productsStore = useProductsStore();
const { showSuccessMessage, showErrorMessage } = useFToast();

const validationSchema = object({
  modules: array()
    .of(
      object().shape({
        name: string().optional(),
        imageUrl: string().optional(),
        category: string().optional(),
        quantity: number().required(),
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
  console.log(
    'productsStore.currentProduct?.modules ',
    productsStore.currentProduct?.modules,
  );
  return productsStore.currentProduct?.modules?.map((module) => ({
    name: module.name,
    imageUrl: module.imageUrl,
    category: module.category,
    quantity: module.quantity,
  }));
});

const submitHandler = handleSubmit(async (values) => {
  try {
    console.log('values ', values);
    showSuccessMessage('Module updated!');
  } catch (error: any) {
    showErrorMessage(error as any);
  }
});

watch(
  () => [modules.value],
  () => {
    submitHandler();
  },
  { immediate: false },
);

onMounted(() => {
  resetForm({
    values: {
      modules: getInitialFormData.value,
    },
  });
});
</script>
