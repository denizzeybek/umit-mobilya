<template>
  <div class="flex flex-col items-center gap-2 group">
    <div class="relative mb-4">
      <a href="#" class="text-gray-800">
        <div
          :class="item.icon"
          class="!text-8xl transition-transform duration-300 font-thin group-hover:-translate-y-2"
        ></div>
      </a>
      <span
        class="absolute left-1/2 bottom-0 w-0 h-[4px] bg-gray-800 transition-all duration-300 group-hover:left-0 group-hover:right-0 group-hover:w-full"
      ></span>
    </div>
    <div class="text-3xl text-center">{{ item.title }}</div>
    <div class="text-center text-lg">
      {{ item.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface IProps {
  item: {
    icon: string;
    title: string;
    text: string;
  };
}

defineProps<IProps>();
</script>

<style scoped></style>
