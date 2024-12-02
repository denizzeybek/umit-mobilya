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
      <Menu ref="menu" :model="menuItems" class="w-full md:w-60" :popup="true">
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
import type { MenuItem } from 'primevue/menuitem';

interface IProps {
  menuItems: MenuItem[];
}

defineProps<IProps>();

const menu = ref();

const toggle = (event) => {
  menu.value.toggle(event);
};
</script>

<style scoped></style>
