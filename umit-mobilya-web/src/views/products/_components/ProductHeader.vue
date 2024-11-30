<template>
  <div class="flex justify-between items-center">
    <Breadcrumb :home="home" :model="items" />
    <ActionsMenu />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import ActionsMenu from './ActionsMenu.vue';
const home = computed(() => {
  return {
    icon: 'pi pi-home',
  };
});
const items = computed(() => {
  return [{ label: 'Products' }, { label: 'Product Detail' }];
});
</script>
