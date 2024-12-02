<template>
  <Card>
    <template #content>
      <div class="flex justify-between items-center">
        <Breadcrumb :home="home" :model="items" />
        <ActionsMenu v-if="usersStore.isAuthenticated" @handleUpdateModal="emit('handleUpdateModal')"/>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUsersStore } from '@/stores/users';
import ActionsMenu from './ActionsMenu.vue';

interface IEmits {
  (event: 'handleUpdateModal'): void;
}
const emit = defineEmits<IEmits>();

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
