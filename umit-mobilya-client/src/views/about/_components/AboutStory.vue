<template>
  <section class="mx-auto max-w-editorial px-5 py-section md:px-10">
    <div class="grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-24">
      <p v-reveal class="eyebrow lg:pt-4">Tutku ve tecrübe</p>

      <div>
        <h2 v-reveal="1" class="display max-w-[20ch] text-display-md text-f-ink">
          Ismarlama mobilya, Türkiye’de hâlâ dar bir kulvar. Biz o kulvardayız.
        </h2>

        <div class="mt-12 grid gap-10 md:grid-cols-2 md:gap-16">
          <p v-reveal="2" class="prose-lede">
            Ümit Mobilya, özel üretim mobilya yapan bir atölye. Hazır ürün
            satmıyoruz; mekânı görüp ölçüsünü alıyor, o mekâna ait olan şeyi
            üretiyoruz. Mimari bir mobilyanın farkı, durduğu yere ait olmasıdır.
          </p>
          <p v-reveal="3" class="prose-lede">
            Fikirleri teknolojiyle birleştiriyoruz: tasarımı üretime girmeden
            önce üç boyutlu çizimle paylaşıyoruz. Bu, üretim sürecini
            kolaylaştırdığı gibi hata payını da asgariye indiriyor — ve siz
            işi bitmeden önce görmüş oluyorsunuz.
          </p>
        </div>

        <dl
          v-reveal="4"
          class="mt-16 grid grid-cols-2 gap-px border border-f-rule bg-f-rule sm:grid-cols-4"
        >
          <div
            v-for="fact in FACTS"
            :key="fact.label"
            class="flex flex-col gap-2 bg-f-bone p-6"
          >
            <dt class="eyebrow">{{ fact.label }}</dt>
            <dd class="display text-2xl text-f-ink">{{ fact.value }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const FACTS = [
  { label: 'Nerede', value: 'Kuşadası' },
  { label: 'Keşif', value: 'Ücretsiz' },
  { label: 'Çizim', value: '3 boyutlu' },
  { label: 'Montaj', value: 'Kendi ekibimiz' },
];
</script>
