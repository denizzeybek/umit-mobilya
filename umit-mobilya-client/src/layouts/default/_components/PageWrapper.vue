<template>
  <div class="flex flex-col flex-1">
    <main
      class="flex flex-col flex-1 rounded-lg p-2 lg:px-9 lg:py-6 bg-f-secondary-purple"
    >
      <div id="alert" class="alert"></div>
      <section class="flex flex-col flex-1 h-full rounded-lg">
        <slot></slot>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
</script>
