<template>
  <div class="flex-1 flex items-center justify-center py-20">
    <div class="w-1/2 flex flex-col lg:flex-row gap-12">
      <template v-for="item in itemList">
        <BannerText
          :title="item.title"
          :text="item.text"
          :sub-text="item.subText"
          center
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import BannerText from '@/views/about/_components/banner/BannerText.vue';

const itemList = [
  {
    title: 'Ahşap atölye',
    text: 'Kuşadası Sanayi Sitesi 10. Sk. No:209400 Kuşadası/Aydın',
    subText: '0 549 676 21 08'
  },
  {
    title: 'Fabrika',
    text: 'Kirazlı yoluCd., Ağaç İşleri Sanayi Sitesi 09400 Kuşadası/Aydın',
    subText: '0 552 152 21 08'
  },
];
</script>

<style scoped></style>
