<template>
  <div>
    <Button
      type="button"
      @click="toggle"
      aria-haspopup="true"
      aria-controls="overlay_menu"
      label="Actions"
    >
    </Button>

    <div class="card flex justify-center">
      <Menu ref="menu" :model="items" class="w-full md:w-60" :popup="true">
        <template #item="{ item, props }">
          <a
            v-ripple
            class="flex items-center"
            v-bind="props.action"
            @click="item.method()"
          >
            <span :class="item.icon" />
            <span>{{ item.label }}</span>
          </a>
        </template>
      </Menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useProductsStore } from '@/stores/products';

interface IEmits {
  (event: 'handleUpdateModal'): void;
}
const emit = defineEmits<IEmits>();

const productsStore = useProductsStore();
const router = useRouter();
const route = useRoute();

const menu = ref();

const toggle = (event) => {
  menu.value.toggle(event);
};

const items = ref([
  {
    label: 'Items',
    items: [
      {
        label: 'Update Modules',
        icon: 'pi pi-pencil',
        method: () => {
          emit('handleUpdateModal');
        },
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        method: async () => {
          await productsStore.remove(route.params.id.toString());
          router.push('/products');
        },
      },
    ],
  },
]);
</script>

<style scoped></style>
