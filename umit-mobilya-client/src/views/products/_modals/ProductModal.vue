<template>
  <Dialog
    v-model:visible="open"
    modal
    :header="isEditing ? 'Ürünü Güncelle' : 'Ürün Ekle'"
    class="!bg-f-paper lg:!w-[700px] !w-full"
    :style="{ width: '50rem' }"
  >
    <form class="flex flex-col gap-6" @submit="submitHandler">
      <div v-if="!isEditing" class="flex justify-center gap-4 flex-1">
        <!-- raw-control: PrimeVue FileUpload kendi yukleme akisini dayatiyor; burada dosya store'a multipart olarak elle veriliyor -->
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
        >
          <template #customFooter>
            <div class="p-4">
              <Button class="!w-full" type="button" @click="showCategoryModal=true">
                Kategori Ekle
              </Button>
            </div>
          </template>
        </FSelect>
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
  <CategoryModal
    v-if="showCategoryModal"
    v-model:open="showCategoryModal"
    @fetchCategories="fetchCategories"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useForm } from 'vee-validate';
import { number,object, string } from 'yup';

import { useFToast } from '@/composables/useFToast';
import { useCategoriesStore } from '@/stores/categories';
import { useProductsStore } from '@/stores/products';
import CategoryModal from '@/views/categories/_components/_modals/CategoryModal.vue';


interface IProps {
  data?: any;
}
const props = defineProps<IProps>();

const emit = defineEmits<IEmits>();
interface IEmits {
  (event: 'fetchProducts'): void;
}
const route = useRoute();
const productsStore = useProductsStore();
const categoriesStore = useCategoriesStore();
const { showSuccessMessage, showErrorMessage } = useFToast();

const open = defineModel<boolean>('open');
const showCategoryModal = ref(false);
const selectedFile = ref<File | null>(null);

const isEditing = computed(() => !!props.data);

const categoryTypeOptions = computed(() => {
  return categoriesStore.list?.map((category) => ({
    name: category.name,
    value: category._id,
  }));
});

const currentCategory = computed(() => {
  return categoryTypeOptions.value.find(
    (category) => category.value === route?.query?.categoryId,
  );
});

const validationSchema = object({
  name: string().required().label('Ürün adı'),
  price: number().required().label('Fiyat'),
  sizes: string().nullable().label('Ebatlar'),
  description: string().nullable().label('Açıklama'),
  category: object()
    .shape({
      name: string().label('Kategori'),
      value: string().label('Kategori').required(),
    })
    .required()
    .label('Kategori'),
});

const { handleSubmit, isSubmitting, resetForm } = useForm({
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
    const fields = {
      name: values.name,
      price: values.price,
      sizes: values.sizes ?? '0',
      description: values.description ?? '',
      category: values.category.value,
    };

    if (isEditing.value) {
      /*
       * The update endpoint takes JSON and has no `image` field — the image is
       * only ever set on create or through the gallery endpoints.
       */
      const currentProduct = productsStore.currentProduct;
      if (!currentProduct) return;
      await productsStore.update(currentProduct._id, fields);
      showSuccessMessage('Ürün Güncellendi!');
    } else {
      if (!selectedFile.value) return;
      await productsStore.create({ ...fields, image: selectedFile.value });
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
    ...(currentCategory.value &&
      !product && {
        category: currentCategory.value,
      }),
  };
});

const fetchCategories = async () => {
  await categoriesStore.fetch();
};

onMounted(async () => {
  await fetchCategories();
  resetForm({
    values: getInitialFormData.value,
  });
});
</script>
