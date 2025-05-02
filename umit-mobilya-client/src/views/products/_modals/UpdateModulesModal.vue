<template>
  <Dialog
    v-model:visible="open"
    modal
    header="Update Modules"
    class="!bg-f-secondary-purple !w-full lg:h-3/4"
    :style="{ width: '50rem' }"
  >
    <Splitter class="lg:!h-full" layout="horizontal">
      <SplitterPanel class="flex flex-col gap-2 p-2 !overflow-y-auto !h-full">
        <div class="flex justify-end gap-2">
          <FSelect
            name="filterCategory"
            placeholder="Kategori Adı Seçin"
            :options="categoryTypeOptions"
            v-model="selectedFilter"
          />
          <FInput
            name="filterName"
            v-model="typedName"
            placeholder="Ürün ismi girin"
          />
        </div>
        <template v-if="isLoading">
          <Skeleton v-for="i in 3" width="100%" height="145px"></Skeleton>
        </template>
        <template v-else>
          <template v-for="(product, idx) in productsList" :key="idx">
            <ModuleItem
              :module="product"
              :type="EModuleItemButtonType.ADD"
              @handleModuleButtonClick="onModuleButtonClick($event)"
            />
          </template>
        </template>
      </SplitterPanel>
      <SplitterPanel class="flex flex-col gap-2 p-2 !overflow-y-auto !h-full">
        <template v-for="(module, idx) in modules" :key="idx">
          <ModuleItem
            :module="module"
            :type="EModuleItemButtonType.REMOVE"
            @handleModuleButtonClick="onModuleButtonClick($event)"
          />
        </template>
      </SplitterPanel>
    </Splitter>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useFToast } from '@/composables/useFToast';
import ModuleItem from './ModuleItem.vue';
import { EModuleItemButtonType } from '@/views/products/_etc/enums/EModuleItemButtonType';
import type {
  IProductFilterDTO,
  IProductRemoveModuleDTO,
  IProductUpdateModuleDTO,
} from '@/interfaces/product/product.interface';
import { useProductsStore } from '@/stores/products';
import { useRoute } from 'vue-router';
import { useCategoriesStore } from '@/stores/categories';
import { watch } from '@vue/reactivity';

interface IFilter {
  name: string;
  value: string;
}

const route = useRoute();
const productsStore = useProductsStore();
const categoriesStore = useCategoriesStore();

const open = defineModel<boolean>('open');
const { showSuccessMessage, showErrorMessage } = useFToast();

const isLoading = ref(false);
const typedName = ref();
const selectedFilter = ref<IFilter>({
  name: 'Tüm Kategoriler',
  value: '',
});

const productsList = computed(() => productsStore.list);
const modules = computed(() => productsStore.currentProduct?.modules);

const categoryTypeOptions = computed(() => {
  const categoriesList = categoriesStore.list?.map((category) => ({
    name: category.name,
    value: category._id as string,
  }));

  return [
    { name: 'Tüm Kategoriler', value: '' },
    ...categoriesList,
  ] as IFilter[];
});

const currentCategory = computed(() => {
  const category = productsStore.currentProduct?.category;
  if (!category) return null;
  return {
    name: category.name,
    value: category._id,
  } as IFilter;
});

const onModuleButtonClick = async (event) => {
  try {
    const { type, id } = event;
    if (type === EModuleItemButtonType.ADD) {
      const payload = {
        productId: route.params.id,
        module: {
          productId: id,
          quantity: 1,
        },
      } as IProductUpdateModuleDTO;
      await productsStore.addModule(payload);
      showSuccessMessage('Modül Eklendi');
    } else {
      const payload = {
        productId: route.params.id,
        moduleId: id,
      } as IProductRemoveModuleDTO;
      await productsStore.removeModule(payload);
      showSuccessMessage('Modül Kaldırıldı');
    }
    await productsStore.find(route.params.id?.toString());
  } catch (error: any) {
    showErrorMessage(error?.response?.data?.message as any);
  }
};

const filterProducts = async () => {
  try {
    isLoading.value = true;
    const payload = {} as IProductFilterDTO;
    if (typedName.value) {
      payload.name = typedName.value;
    }
    if (selectedFilter.value.value) {
      payload.category = selectedFilter.value.value;
    }
    await productsStore.filter(payload);
    isLoading.value = false;
  } catch (error: any) {
    showErrorMessage(error?.response?.data?.message as any);
  }
};

watch([selectedFilter, typedName], filterProducts);

onMounted(async () => {
  await categoriesStore.fetch();
  if (currentCategory.value) {
    selectedFilter.value = currentCategory.value;
  }
});
</script>
