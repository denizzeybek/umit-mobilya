<template>
  <div class="flex flex-wrap lg:flex-nowrap justify-between w-full p-20 gap-20">
    <BoxItem v-for="(item, key) in items" :item="item" :key="key" />
  </div>
</template>

<script setup lang="ts">
import BoxItem from './BoxItem.vue';

const items = [
  {
    icon: 'pi pi-search',
    title: 'Ücretsiz Keşif',
    text: 'Ücretsiz keşif hizmetiyle, size en uygun çözümlerimizi keşfedin!',
  },
  {
    icon: 'pi pi-desktop',
    title: 'Tasarım',
    text: 'Uzman tasarım ekibiyle hayalinizdeki mekânı yaratın.',
  },
  {
    icon: 'pi pi-heart',
    title: 'Üretim',
    text: 'Kaliteli malzemeler ve uzman işçilik ile özgün üretim çözümleri.',
  },
  {
    icon: 'pi pi-check',
    title: 'Montaj',
    text: 'Deneyimli ekibimiz, hassas ve profesyonel montaj hizmetleri sunuyor.',
  },
];
</script>

<style scoped></style>
