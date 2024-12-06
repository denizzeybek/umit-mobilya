<template>
  <Dialog
    v-model:visible="open"
    modal
    header="Update Modules"
    class="!bg-f-secondary-purple !w-full lg:h-3/4"
    :style="{ width: '50rem' }"
  >
    <Splitter class="lg:h-full" layout="horizontal">
      <SplitterPanel class="flex flex-col gap-2 p-2 !overflow-y-auto">
        <template v-for="(module, idx) in productsList" :key="idx">
          <ModuleItem
            :module="module"
            :type="EModuleItemButtonType.ADD"
            @handleModuleButtonClick="onModuleButtonClick($event)"
          />
        </template>
      </SplitterPanel>
      <SplitterPanel class="flex flex-col gap-2 p-2 !overflow-y-auto">
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
import { computed, ref } from 'vue';
import { useFToast } from '@/composables/useFToast';
import ModuleItem from './ModuleItem.vue';
import { EModuleItemButtonType } from '@/views/products/_etc/enums/EModuleItemButtonType';
import type { IProductRemoveModuleDTO, IProductUpdateModuleDTO } from '@/interfaces/product/product.interface';
import { useProductsStore } from '@/stores/products';
import { useRoute } from 'vue-router';

const route = useRoute();
const productsStore = useProductsStore();

const open = defineModel<boolean>('open');
const { showSuccessMessage, showErrorMessage } = useFToast();

const productsList = computed(() => productsStore.list);
const modules = computed(() => productsStore.currentProduct?.modules);

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
      showSuccessMessage('Module added successfully');
    } else {
      const payload = {
        productId: route.params.id,
        moduleId: id
      } as IProductRemoveModuleDTO;
      await productsStore.removeModule(payload);
      showSuccessMessage('Module removed successfully');
    }
    await productsStore.find(route.params.id?.toString());
  } catch (error: any) {
    showErrorMessage(error?.response?.data?.message as any);
  }
};
</script>
