<template>
  <div class="flex flex-col min-h-screen">
    <div class="fixed top-0 left-0 w-full z-50">
      <PageHeader @drawerChange="visible = $event" />
    </div>
  <div class="flex w-full flex-grow 3xl:justify-center mt-[101px]">
    <div class="flex flex-col w-full relative">
      <PageWrapper>
        <RouterView />
      </PageWrapper>
    </div>
  </div>
</div>
</template>

<script lang="ts" setup>
import PageWrapper from './_components/PageWrapper.vue';
import { ref } from 'vue';
import PageHeader from './_components/PageHeader.vue';

const visible = ref(false);
</script>
