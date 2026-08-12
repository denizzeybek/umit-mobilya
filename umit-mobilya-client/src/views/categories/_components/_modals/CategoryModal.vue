<template>
  <Dialog
    v-model:visible="open"
    modal
    :header="isEditing ? 'Kategori Editle' : 'Kategori Ekle'"
    class="!bg-f-paper lg:!w-[700px] !w-full"
    :style="{ width: '50rem' }"
  >
    <form class="flex flex-col gap-6" @submit="submitHandler">
      <div class="flex gap-4 flex-1">
        <FInput
          class="grow"
          label="Categori Adı"
          name="name"
          placeholder="Kategori adı girin"
        />
      </div>
      <div class="flex w-50 justify-center">
        <Button
          :disabled="isSubmitting"
          :loading="isSubmitting"
          type="submit"
          label="Kaydet"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useForm } from 'vee-validate';
import { object,string } from 'yup';

import { useFToast } from '@/composables/useFToast';
import { useCategoriesStore } from '@/stores/categories';

import type { CreateCategoryDto } from '@/client';

interface IProps {
  data?: any;
}
const props = defineProps<IProps>();

const emit = defineEmits<IEmits>();
interface IEmits {
  (event: 'fetchCategories'): void;
}
const { showSuccessMessage, showErrorMessage } = useFToast();
const categoriesStore = useCategoriesStore();

const open = defineModel<boolean>('open');

const isEditing = computed(() => !!props.data);

const validationSchema = object({
  name: string().required().label('Kategori Adı'),
});

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema,
});

const handleClose = () => {
  resetForm();
  open.value = false;
};

const submitHandler = handleSubmit(async (values) => {
  try {
    const payload = {
      name: values.name,
    } as CreateCategoryDto;
    if (isEditing.value) {
      // await categoriesStore.update(productsStore.currentProduct._id ,payload);
      showSuccessMessage('Ürün güncellendi!');
    } else {
      await categoriesStore.create(payload);
      showSuccessMessage('Ürün Eklendi!');
    }

    emit('fetchCategories');
    handleClose();
  } catch (error: any) {
    showErrorMessage(error as any);
  }
});

const getInitialFormData = computed(() => {
  const category = props.data;
  return {
    ...(category && {
      name: category.name,
    }),
  };
});

onMounted(async () => {
  resetForm({
    values: getInitialFormData.value,
  });
});
</script>
