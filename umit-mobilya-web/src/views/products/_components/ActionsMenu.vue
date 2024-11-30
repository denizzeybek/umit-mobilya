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
          <a v-ripple class="flex items-center" v-bind="props.action">
            <span :class="item.icon" />
            <span >{{ item.label }}</span>
          </a>
        </template>
      </Menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

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
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
      },
    ],
  },
]);
</script>

<style scoped></style>
