<template>
  <div class="flex flex-col min-h-screen">
  <PageHeader @drawerChange="visible = $event" />
  <div class="flex w-full flex-grow 3xl:justify-center">
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
