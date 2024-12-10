<template>
  <div
    class="flex flex-col sm:flex-row bg-f-body-bg rounded-md sm:items-center p-6 gap-4"
  >
    <div class="md:w-40 relative">
      <img
        class="block xl:block mx-auto rounded-md w-full sm:w-80"
        :src="module.imageUrl"
        :alt="module.name"
      />
    </div>
    <div
      class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6"
    >
      <ProductItemContent :product="module" />
      <Button
        :icon="buttonProps?.icon"
        :label="buttonProps?.label"
        :severity="buttonProps?.severity"
        @click="buttonProps?.method()"
        outlined
        class="!flex-1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IProductModule } from '@/interfaces/product/product.interface';
import { computed } from 'vue';
import { EModuleItemButtonType } from '@/views/products/_etc/enums/EModuleItemButtonType';
import ProductItemContent from '../_components/ProductItemContent.vue';

interface IProps {
  module: IProductModule;
  type: EModuleItemButtonType;
}

const props = defineProps<IProps>();

interface IClickMethod {
  type: EModuleItemButtonType;
  id: string;
}

interface IEmits {
  (event: 'handleModuleButtonClick', params: IClickMethod): void;
}
const emit = defineEmits<IEmits>();

const buttonProps = computed(() => {
  if (props.type === EModuleItemButtonType.ADD) {
    return {
      icon: 'pi pi-plus',
      label: 'Ekle',
      severity: 'contrast',
      method: () => {
        emit('handleModuleButtonClick', {
          type: EModuleItemButtonType.ADD,
          id: props.module._id,
        });
      },
    };
  } else if (props.type === EModuleItemButtonType.REMOVE) {
    return {
      icon: 'pi pi-minus',
      label: 'Sil',
      severity: 'danger',
      method: () => {
        emit('handleModuleButtonClick', {
          type: EModuleItemButtonType.REMOVE,
          id: props.module._id,
        });
      },
    };
  }
});
</script>

<style scoped></style>
