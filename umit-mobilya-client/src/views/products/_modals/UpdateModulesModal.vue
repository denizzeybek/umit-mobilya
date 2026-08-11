<template>
  <Dialog
    v-model:visible="open"
    modal
    header="Modülü Güncelle"
    class="!bg-f-secondary-purple !w-full lg:h-3/4"
    :style="{ width: '50rem' }"
  >
    <Splitter class="lg:!h-full" layout="horizontal">
      <SplitterPanel class="flex flex-col gap-2 p-2 !overflow-y-auto !h-full">
        <div class="flex justify-end gap-2">
          <FSelect
            v-model="selectedFilter"
            name="filterCategory"
            placeholder="Kategori Adı Seçin"
            :options="categoryTypeOptions"
          />
          <FInput
            v-model="typedName"
            name="filterName"
            placeholder="Ürün ismi girin"
          />
        </div>
        <template v-if="isLoading">
          <Skeleton v-for="i in 3" :key="i" width="100%" height="145px"></Skeleton>
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
import { watch } from 'vue';
import { useRoute } from 'vue-router';

import { useFToast } from '@/composables/useFToast';
import { useCategoriesStore } from '@/stores/categories';
import { useProductsStore } from '@/stores/products';
import { EModuleItemButtonType } from '@/views/products/_etc/enums/EModuleItemButtonType';

import ModuleItem from './ModuleItem.vue';

import type { IClickMethod } from './ModuleItem.vue';


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

const onModuleButtonClick = async (event: IClickMethod) => {
  try {
    const { type, id } = event;
    const productId = route.params.id?.toString() ?? '';

    if (type === EModuleItemButtonType.ADD) {
      await productsStore.addModule({
        productId,
        module: { productId: id, quantity: 1 },
      });
      showSuccessMessage('Modül Eklendi');
    } else {
      await productsStore.removeModule(productId, id);
      showSuccessMessage('Modül Kaldırıldı');
    }
    await productsStore.find(productId);
  } catch (error) {
    showErrorMessage(error);
  }
};

const filterProducts = async () => {
  try {
    isLoading.value = true;
    await productsStore.filter({
      ...(typedName.value ? { name: typedName.value } : {}),
      ...(selectedFilter.value.value
        ? { category: selectedFilter.value.value }
        : {}),
    });
    isLoading.value = false;
  } catch (error) {
    showErrorMessage(error);
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
