<template>
  <Carousel
    :value="images"
    :numVisible="2"
    :numScroll="3"
    :responsiveOptions="responsiveOptions"
    :circular="true"
  >
    <template #item="slotProps">
      <img
        :src="slotProps.data"
        alt="slotProps.data.name"
        class="w-full rounded max-h-[420px]"
      />
    </template>
  </Carousel>
  <div
    class="bg-neutral-300 left-0 right-0 -mx-9 relative rounded-md flex-1 py-10"
  >
    <Carousel
      :value="textList"
      :numVisible="1"
      :numScroll="1"
      :responsiveOptions="responsiveOptions"
      :circular="true"
    >
      <template #item="slotProps">
        <div class="flex justify-center w-full">
          <div class="w-1/2 text-center text-2xl">
            {{ slotProps.data }}
          </div>
        </div>
      </template>
    </Carousel>
  </div>
  <Footer />
</template>

<script setup>
import { ref } from 'vue';
import Footer from '@/views/about/_components/footer/Footer.vue';

const images = ref([
  '/carousel/banyo.jpg',
  '/carousel/mutfak.jpg',
  '/carousel/tv.jpg',
]);

const textList = [
  'Fikirleri teknolojiyle birleştirir, tasarımları henüz üretime girmeden 3 boyutlu çizimlerle sizlerle paylaşırız. Bu sayede üretim sürecini kolaylaştırır ve hata payını asgari düzeye indiririz.',
  'Herhangi bir mobilya ihtiyacınızda, Ümit Mobilya"ya gelerek isteklerinizi paylaşırsınız. Beraber hayal kurar, beraber tasarlarız. Sizin hayalleriniz, bizim teknik bilgimizle birleşir.',
  'Uygun hacimler, konforlu detaylar, kullanışlı çözümler sunarız. Yaşam alanlarınızda size özel farklılıkları hisseder, eşsiz fikirlerin tadını çıkarırsınız.',
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
