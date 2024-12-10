<template>
  <div class="flex flex-col left-0 right-0 -mx-9 relative">
    <BannerImage />
    <div>
      <div class="w-full flex">
        <BannerCarousel />
        <div class="flex-1 flex gap-4 px-12 py-10 bg-gray-200">
          <BannerContent />
        </div>
      </div>

      <div class="bg-neutral-300 px-12 py-10 flex justify-center w-full gap-4">
        <div class="w-1/2">
          <BannerText :title="content.title" :text="content.text" center />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BannerCarousel from './BannerCarousel.vue';
import BannerImage from './BannerImage.vue';
import BannerContent from './BannerContent.vue';
import BannerText from './BannerText.vue';

const content = {
  title: 'Tutku ve Tecrübe',
  text: " Özel üretim mobilya konusunda faaliyet gösteren Ümit Mobilya, sunduğu özel tasarım ürünleri ile yüksek beğeni kazanmaktadır. Müşterilerimizin özel yere göre tasarlanmış, mimari bir mobilyanın ayrıcalıklı zevkini tatması için çalışmalar yapmaktadır. Türkiye'de çok az olarak gördüğümüz bu özel yere göre mobilya kulvarını genişletmek ve pazar payını artırmak için faaliyetler ve bilgilendirme çalışmaları vardır.",
};
</script>

<style scoped></style>
