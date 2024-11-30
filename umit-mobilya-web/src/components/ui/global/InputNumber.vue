<template>
  <div class="flex items-center w-full mx-auto justify-center">
    <button
      class="group rounded-l-full px-6 py-[18px] border border-gray-200 flex items-center justify-center shadow-sm shadow-transparent transition-all duration-500 hover:shadow-gray-200 hover:border-gray-300 hover:bg-gray-50"
    >
      <span class="pi pi-minus"></span>
    </button>
    <input
      type="text"
      class="border-y border-gray-200 outline-none text-gray-900 font-semibold text-lg w-full max-w-[118px] min-w-[80px] placeholder:text-gray-900 py-[13px] text-center bg-transparent"
      placeholder="1"
    />
    <button
      class="group rounded-r-full px-6 py-[18px] border border-gray-200 flex items-center justify-center shadow-sm shadow-transparent transition-all duration-500 hover:shadow-gray-200 hover:border-gray-300 hover:bg-gray-50"
    >
      <span class="pi pi-plus"></span>
    </button>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
