<template>
  <PageHero
    image="/img/hero-about.webp"
    alt="Atölyede duvara yaslanmış meşe ve ceviz keresteler, tezgâhta el rendeleri"
    eyebrow="Hakkımızda"
    title="Ölçüyü biz alırız, işi biz yaparız, montajı biz yaparız."
    lede="Kuşadası’nda ısmarlama mobilya üreten bir atölye. Ne yaptığımız kadar nasıl yaptığımız da burada."
  />
  <AboutStory />
  <AboutWorkshop />
  <ProcessSteps />
  <MaterialNote />
</template>

<script setup lang="ts">
import MaterialNote from '@/components/ui/local/MaterialNote.vue';
import PageHero from '@/components/ui/local/PageHero.vue';
import ProcessSteps from '@/components/ui/local/ProcessSteps.vue';

import AboutStory from '../_components/AboutStory.vue';
import AboutWorkshop from '../_components/AboutWorkshop.vue';
</script>
