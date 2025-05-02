<template>
  <div class="card">
    <MegaMenu
      :model="items"
      class="p-4 bg-surface-0 !w-full"
      style="border-radius: 3rem"
    >
      <template #start>
        <RouterLink
          :to="{ name: ERouteNames.Dashboard }"
          class="!w-60 lg:mr-10"
        >
          <img
            class="!w-60 lg:mr-10"
            src="@/assets/images/umit-mobilya-logo.png"
          />
        </RouterLink>
      </template>
      <template #item="{ item }">
        <Button
          v-if="item.root && !item?.items?.length"
          severity="secondary"
          :variant="isActive(item) ? undefined : 'text'"
          @click="
            item?.method && !item?.items?.length
              ? item.method()
              : router.push(item.route)
          "
        >
          <span>{{ item.label }}</span>
        </Button>
        <Button
          v-else
          severity="secondary"
          class="w-full"
          :variant="isActive(item) ? undefined : 'text'"
          @click="item?.method"
        >
          {{ item.label }}
        </Button>
      </template>
    </MegaMenu>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import MegaMenu from 'primevue/megamenu';
import { ERouteNames } from '@/router/routeNames.enum';
import { useUsersStore } from '@/stores/users';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { useCategoriesStore } from '@/stores/categories';

interface IEmits {
  (event: 'drawerChange', val: boolean): void;
}

defineEmits<IEmits>();

const authStore = useAuthStore();
const usersStore = useUsersStore();
const route = useRoute();
const router = useRouter();
const categoriesStore = useCategoriesStore();

const categoryTypeOptions = computed(() => {
  return categoriesStore.list?.map((category) => ({
    label: category.name,
    root: false,
    route: { name: ERouteNames.ProductsList },
    method: () => {
      router.push({
        name: ERouteNames.ProductsList,
        query: { categoryId: category._id },
      });
    },
  }));
});

const items = computed(() => {
  return [
    {
      label: 'Ürünler',
      root: true,
      route: { name: ERouteNames.ProductsList },
      items: [[{ items: [...categoryTypeOptions.value] }]],
    },
    {
      label: 'Hakkımızda',
      root: true,
      route: { name: ERouteNames.About },
    },
    {
      label: 'İletişim',
      root: true,
      route: { name: ERouteNames.Contact },
    },
    ...(!usersStore.isAuthenticated
      ? [
          {
            label: 'Giriş Yap',
            root: true,
            route: { name: ERouteNames.Login },
          },
        ]
      : []),
    ...(usersStore.isAuthenticated
      ? [
          {
            label: 'Kategoriler',
            root: true,
            route: { name: ERouteNames.CategoriesList },
          },
          {
            label: 'Çıkış Yap',
            route: { name: ERouteNames.Login },
            root: true,
            method: () => {
              console.log('here!!');
              authStore.logout();
            },
          },
        ]
      : []),
  ];
});

const isActive = (item) => {
  return route.name === item.route.name;
};

onMounted(async () => {
  await categoriesStore.fetch();
});
</script>

<style>
.p-megamenu-overlay {
  min-width: fit-content !important;
  left: unset !important;
}
.p-megamenu-submenu-label {
  padding: 0 !important;
}

.p-megamenu-item-content:hover {
  background: transparent !important;
}
</style>
