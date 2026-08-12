<template>
  <section class="bg-f-primary py-section text-f-bone">
    <div class="mx-auto max-w-editorial px-5 md:px-10">
      <div class="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p class="eyebrow !text-f-brass-light">Atölye</p>
          <h2 v-reveal class="display mt-5 max-w-[16ch] text-display-md text-f-bone">
            Ürettiğimiz yer, ürünün yarısıdır.
          </h2>
        </div>
        <p v-reveal="1" class="prose-lede max-w-prose !text-f-bone/70">
          Kuşadası Sanayi Sitesi’ndeki atölyemizde kesim, kenar bantlama,
          birleşim ve montaj öncesi kuru kurulum aynı çatı altında yapılıyor.
          İşi taşerona vermiyoruz.
        </p>
      </div>
    </div>

    <div
      class="mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:px-10 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0"
    >
      <figure
        v-for="(shot, index) in SHOTS"
        :key="shot.src"
        v-reveal="index"
        class="w-[82vw] shrink-0 snap-start sm:w-[60vw] lg:w-auto"
      >
        <div class="grain relative overflow-hidden">
          <FImage
            :src="shot.src"
            :alt="shot.alt"
            ratio="3 / 2"
            sizes="(min-width: 1024px) 33vw, 80vw"
            has-variants
          />
        </div>
        <figcaption class="mt-4 flex items-baseline gap-3">
          <span class="index-numeral text-xs text-f-brass-light">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span class="text-sm text-f-bone/70">{{ shot.caption }}</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
const SHOTS = [
  {
    src: '/img/atolye/atolye-genel.webp',
    alt: 'Atölyenin genel görünümü, tezgâhlar ve kereste rafı',
    caption: 'Kesim ve birleşim',
  },
  {
    src: '/img/atolye/atolye-el.webp',
    alt: 'Ceviz bir tahtayı rendeleyen eller',
    caption: 'El işçiliği',
  },
  {
    src: '/img/atolye/atolye-malzeme.webp',
    alt: 'Rafta istiflenmiş meşe, ceviz ve dişbudak levhalar',
    caption: 'Malzeme seçimi',
  },
];
</script>
