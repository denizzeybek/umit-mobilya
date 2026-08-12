<template>
  <div
    class="flex items-center justify-between gap-4 border-b border-f-rule pb-5"
  >
    <nav class="flex items-center gap-3 text-sm" aria-label="Konum">
      <RouterLink
        :to="{ name: ERouteNames.ProductsList }"
        class="text-f-ink-muted transition-colors duration-300 hover:text-f-ink"
      >
        İşler
      </RouterLink>
      <span class="text-f-rule-strong" aria-hidden="true">/</span>
      <span class="truncate text-f-ink">
        {{ productsStore.currentProduct?.name ?? 'Ürün' }}
      </span>
    </nav>

    <FActionsMenu v-if="usersStore.isAuthenticated" :menuItems="menuItems" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useFToast } from '@/composables/useFToast';
import { ERouteNames } from '@/router/routeNames.enum';
import { useProductsStore } from '@/stores/products';
import { useUsersStore } from '@/stores/users';

interface IEmits {
  (event: 'handleUpdateProduct'): void;
  (event: 'handleUpdateModal'): void;
  (event: 'handleImagesModal'): void;
  (event: 'handleEditImagesModal'): void;
}

const emit = defineEmits<IEmits>();

const usersStore = useUsersStore();
const productsStore = useProductsStore();
const router = useRouter();
const route = useRoute();
const { showErrorMessage } = useFToast();

const menuItems = ref([
  {
    label: '',
    items: [
      {
        label: 'Ürünü Güncelle',
        icon: 'pi pi-cog',
        method: () => emit('handleUpdateProduct'),
      },
      {
        label: 'Modülleri Güncelle',
        icon: 'pi pi-pencil',
        method: () => emit('handleUpdateModal'),
      },
      {
        label: 'Galeriye Resim Ekle',
        icon: 'pi pi-plus',
        method: () => emit('handleImagesModal'),
      },
      {
        label: 'Galeriyi Düzenle',
        icon: 'pi pi-pencil',
        method: () => emit('handleEditImagesModal'),
      },
      {
        label: 'Ürünü Sil',
        icon: 'pi pi-trash',
        method: async () => {
          try {
            await productsStore.remove(route.params.id.toString());
            router.push({ name: ERouteNames.ProductsList });
          } catch (error) {
            showErrorMessage(error);
          }
        },
      },
    ],
  },
]);
</script>

<style>
.p-menu-submenu-label {
  padding: 0 !important;
}
</style>
