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

const menuItems = ref([
  {
    label: 'Items',
    items: [
      {
        label: 'Ürünü Güncelle',
        icon: 'pi pi-cog',
        method: () => {
          emit('handleUpdateProduct');
        },
      },
      {
        label: 'Modülleri Güncelle',
        icon: 'pi pi-pencil',
        method: () => {
          emit('handleUpdateModal');
        },
      },
      {
        label: 'Galeriye Resim Ekle',
        icon: 'pi pi-plus',
        method: () => {
          emit('handleImagesModal');
        },
      },
      ...(productsStore.currentProduct?.imageUrlList?.length
        ? [
            {
              label: 'Galeriyi Düzenle',
              icon: 'pi pi-trash',
              method: () => {
                emit('handleEditImagesModal');
              },
            },
          ]
        : []),
      {
        label: 'Ürünü Sil',
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
  return [{ label: 'Ürünler' }, { label: 'Ürün Detayı' }];
});
</script>
