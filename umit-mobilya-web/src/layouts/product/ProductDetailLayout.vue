<template>
  <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Toolbar Row -->
    <div class="col-span-2 lg:col-span-3">
      <slot name="breadcrumb" />
    </div>
    <div class="col-span-2">
      <slot name="details" />
    </div>
    <div
      class="col-span-2 lg:col-span-1  sm:w-auto"
    >
      <slot name="basket" />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
