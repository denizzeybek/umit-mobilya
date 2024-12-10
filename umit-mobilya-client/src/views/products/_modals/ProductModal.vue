<template>
  <Dialog
    v-model:visible="open"
    modal
    :header="isEditing ? 'Ürünü Güncelle' : 'Ürün Ekle'"
    class="!bg-f-secondary-purple lg:!w-[700px] !w-full"
    :style="{ width: '50rem' }"
  >
    <form class="flex flex-col gap-6" @submit="submitHandler">
      <div v-if="!isEditing" class="flex justify-center gap-4 flex-1">
        <input type="file" accept="image/*" @change="fileSelected" />
      </div>
      <div class="flex gap-4 flex-1">
        <FInput
          class="grow"
          label="Ürün adı"
          name="name"
          placeholder="Ürün ismi girin"
        />
        <FInput
          class="grow"
          label="Fiyat"
          name="price"
          placeholder="Fiyat girin"
        />
      </div>

      <div class="flex gap-4 flex-1">
        <FInput
          class="grow"
          label="Ebatlar"
          name="sizes"
          placeholder="Ebat girin (150x200x180)"
        />
        <FInput
          class="grow"
          label="Açıklama"
          name="description"
          placeholder="Açıklama girin"
        />
      </div>
      <div class="flex gap-4 flex-1">
        <FSelect
          class="grow"
          label="Kategori"
          name="category"
          placeholder="Kategori Seçin"
          :options="categoryTypeOptions"
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
import { computed, onMounted, ref } from 'vue';
import { useForm } from 'vee-validate';
import { string, object, number } from 'yup';
import { useFToast } from '@/composables/useFToast';
import { useProductsStore } from '@/stores/products';
import { useCategoriesStore } from '@/stores/categories';
import type { IProductDTO } from '@/interfaces/product/product.interface';

interface IProps {
  data?: any;
}
const props = defineProps<IProps>();

interface IEmits {
  (event: 'fetchProducts'): void;
}
const emit = defineEmits<IEmits>();

const productsStore = useProductsStore();
const categoriesStore = useCategoriesStore();
const { showSuccessMessage, showErrorMessage } = useFToast();

const open = defineModel<boolean>('open');
const selectedFile = ref<File | null>(null);

const isEditing = computed(() => !!props.data);

const categoryTypeOptions = computed(() => {
  return categoriesStore.list?.map((category) => ({
    name: category.name,
    value: category._id,
  }));
});

const validationSchema = object({
  name: string().required().label('Ürün adı'),
  price: number().required().label('Fiyat'),
  sizes: string().required().label('Ebatlar'),
  description: string().required().label('Açıklama'),
  category: object()
    .shape({
      name: string().label('Kategori'),
      value: string().label('Kategori').required(),
    })
    .required()
    .label('Kategori'),
});

const { handleSubmit, isSubmitting, resetForm, defineField } = useForm({
  validationSchema,
});

const handleClose = () => {
  resetForm();
  open.value = false;
};

// Dosya seçimi event handler'ı
const fileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0];
  }
};

const submitHandler = handleSubmit(async (values) => {
  try {
    const payload = {
      name: values.name,
      price: values.price,
      sizes: values.sizes,
      description: values.description,
      category: values.category.value,
      image: selectedFile.value,
    } as IProductDTO;
    if (isEditing.value) {
      delete payload.image;
      await productsStore.update(productsStore.currentProduct._id ,payload);
      showSuccessMessage('Ürün Güncellendi!');
    } else {
      await productsStore.create(payload);
      showSuccessMessage('Ürün eklendi!');
    }

    emit('fetchProducts');
    handleClose();
  } catch (error: any) {
    showErrorMessage(error as any);
  }
});

const getInitialFormData = computed(() => {
  const product = props.data;
  return {
    ...(product && {
      name: product.name,
      price: product.price,
      sizes: product.sizes,
      description: product.description,
      category: { name: product.category?.name, value: product.category?._id },
    }),
  };
});

onMounted(async () => {
  await categoriesStore.fetch();
  resetForm({
    values: getInitialFormData.value,
  });
});
</script>
