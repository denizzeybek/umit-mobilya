<template>
  <div
    class="lg:flex-1 py-10 lg:flex lg:items-center bg-stone-500 text-white"
  >
    <Carousel
      :value="textList"
      :numVisible="1"
      :numScroll="1"
      :responsiveOptions="responsiveOptions"
      :circular="true"
      class="my-12"
    >
      <template #item="slotProps">
        <div class="flex justify-center w-full">
          <div class="w-3/4 text-center text-2xl">
            {{ slotProps.data }}
          </div>
        </div>
      </template>
    </Carousel>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const textList = [
  'Uygun hacimler, konforlu detaylar, kullanışlı çözümler sunarız. Yaşam alanlarınızda size özel farklılıkları hisseder, eşsiz fikirlerin tadını çıkarırsınız.',
  'Fikirleri teknolojiyle birleştirir, tasarımları henüz üretime girmeden 3 boyutlu çizimlerle sizlerle paylaşırız. Bu sayede üretim sürecini kolaylaştırır ve hata payını asgari düzeye indiririz.',
  "Herhangi bir mobilya ihtiyacınızda, Ümit Mobilya'ya gelerek isteklerinizi paylaşırsınız. Beraber hayal kurar, beraber tasarlarız. Sizin hayalleriniz, bizim teknik bilgimizle birleşir.",
];
const responsiveOptions = ref([
  {
    breakpoint: '1400px',
    numVisible: 2,
    numScroll: 1,
  },
  {
    breakpoint: '1199px',
    numVisible: 3,
    numScroll: 1,
  },
  {
    breakpoint: '767px',
    numVisible: 2,
    numScroll: 1,
  },
  {
    breakpoint: '575px',
    numVisible: 1,
    numScroll: 1,
  },
]);
</script>

<style scoped></style>
