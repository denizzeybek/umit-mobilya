<template>
  <div class="flex-1 flex flex-col gap-4">
    <div
      :class="center ? 'text-center' : 'text-left'"
      class="text-3xl font-semibold"
    >
      {{ title }}
    </div>
    <div :class="center ? 'text-center' : 'text-left'" class="text-lg">
      {{ text }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface IProps {
  title: string;
  text: string;
  center?: boolean;
}

withDefaults(defineProps<IProps>(), {
  center: false,
});
</script>

<style scoped></style>
