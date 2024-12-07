<template>
  <Dialog
    v-model:visible="open"
    modal
    header="Post Image"
    class="!bg-f-secondary-purple lg:!w-[700px] !w-full"
    :style="{ width: '50rem' }"
  >
    <form class="flex flex-col gap-6" @submit="submitHandler">
      <div class="flex justify-center gap-4 flex-1">
        <input type="file" accept="image/*" @change="fileSelected" />
      </div>
      <div class="flex gap-4 flex-1">
        <FInput
          id="caption"
          name="caption"
          placeholder="Caption"
          class="grow"
        />
      </div>
      <div class="flex w-50 justify-center">
        <Button
          :disabled="isSubmitting"
          :loading="isSubmitting"
          type="submit"
          label="Save"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useForm } from 'vee-validate';
import { string, object, number } from 'yup';
import { useFToast } from '@/composables/useFToast';
import { useProductsStore } from '@/stores/products';
import { useCategoriesStore } from '@/stores/categories';
import type { IProductDTO } from '@/interfaces/product/product.interface';
import UploadImages from './UploadImages.vue';

interface IProps {
  data?: any;
}
const props = defineProps<IProps>();

interface IEmits {
  (event: 'fetchProducts'): void;
}
const emit = defineEmits<IEmits>();

const { showSuccessMessage, showErrorMessage } = useFToast();
const productsStore = useProductsStore();
const categoriesStore = useCategoriesStore();

const open = defineModel<boolean>('open');
const fileupload = ref();
const selectedFile = ref<File | null>(null);

const validationSchema = object({
  caption: string().required('Caption is required'),
});

// Dosya seçimi event handler'ı
const fileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  console.log('input.files ', input.files);
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0];
    console.log('Selected file:', selectedFile.value);
  }
};

const { handleSubmit, isSubmitting, resetForm, defineField } = useForm({
  validationSchema,
});

const handleClose = () => {
  resetForm();
  open.value = false;
};

const submitHandler = handleSubmit(async (values) => {
  try {
    const payload = {
      image: selectedFile.value,
      caption: values.caption,
    };

    await productsStore.createImage(payload);
    showSuccessMessage('Product created!');

    handleClose();
  } catch (error: any) {
    showErrorMessage(error as any);
  }
});
</script>
