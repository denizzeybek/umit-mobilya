<template>
  <div class="flex-1 flex gap-4">
    <div v-for="(text, idx) in textList" :key="idx">
      <BannerText :title="text.title" :text="text.text" />
    </div>
  </div>
</template>

<script setup lang="ts">
import BannerText from './BannerText.vue';

const textList = [
  {
    title: 'NELER YAPARIZ?',
    text: 'Yıllardır özel üretim mobilya konusunda faaliyet gösteren Ümit Mobilya, sunduğu özel tasarım ürünleri ile yüksek beğeni kazanmaktadır. Müşterilerimizin özel yere göre tasarlanmış, mimari bir mobilyanın ayrıcalıklı zevkini tatması için çalışmalar yapmaktadır. Türkiye de çok az olarak gördüğümüz bu özel yere göre mobilya kulvarını genişletmek ve pazar payını artırmak için faaliyetler ve bilgilendirme çalışmaları vardır.',
  },
  {
    title: 'Biz Kimiz?',
    text: "Ümit Mobilya 25 yıllık birikimini, ev konforu uzmanlığı olarak adlandırmaktadır. Ev için tüm mobilya ihtiyaçlarınızı karşılayacak tecrübeli ev konforu uzmanıdır, kişiye özel tasarımlarla müşteri odaklı hizmet sunar. 1998'den beri modanın ve kalitenin sektöründeki en önemli unsurlar olduğuna inanır, tasarım ve mobilya imalatında bu kavramların vazgeçilmezliğini kanıtlar.",
  },
];
</script>

<style scoped></style>
