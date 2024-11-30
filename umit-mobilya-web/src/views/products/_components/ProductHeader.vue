<template>
  <div class="flex justify-between items-center">
    <Breadcrumb :home="home" :model="items" />
    <ActionsMenu v-if="usersStore.isAuthenticated"/>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUsersStore } from '@/stores/users';
import ActionsMenu from './ActionsMenu.vue';

const usersStore = useUsersStore();

const home = computed(() => {
  return {
    icon: 'pi pi-home',
  };
});
const items = computed(() => {
  return [{ label: 'Products' }, { label: 'Product Detail' }];
});
</script>
