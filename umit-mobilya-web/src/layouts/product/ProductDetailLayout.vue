<template>
  <div class="grid grid-flow-row-dense grid-cols-2 lg:grid-cols-3 relative">
    <div class="col-span-2 overflow-y-auto">
      <slot name="details" />
    </div>
    <div class="relative w-full">
      <div
        class="col-span-2 lg:col-span-1 lg:fixed top-[101px] right-0 w-full sm:w-auto bg-white shadow-lg p-4"
      >
        <slot name="basket" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
