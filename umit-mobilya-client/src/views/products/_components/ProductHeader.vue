<template>
  <Card>
    <template #content>
      <div class="flex justify-between items-center">
        <Breadcrumb :home="home" :model="items" />
        <FActionsMenu
          v-if="usersStore.isAuthenticated"
          :menuItems="menuItems"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUsersStore } from '@/stores/users';
import { useProductsStore } from '@/stores/products';

interface IEmits {
  (event: 'handleUpdateModal'): void;
  (event: 'handleUpdateModal'): void;
}
const emit = defineEmits<IEmits>();

const usersStore = useUsersStore();
const productsStore = useProductsStore();
const router = useRouter();
const route = useRoute();

const menuItems = ref([
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

const home = computed(() => {
  return {
    icon: 'pi pi-home',
  };
});

const items = computed(() => {
  return [{ label: 'Products' }, { label: 'Product Detail' }];
});
</script>
