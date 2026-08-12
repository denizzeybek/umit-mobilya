<template>
  <section class="bg-f-linen">
    <div class="mx-auto max-w-editorial px-5 py-section md:px-10">
      <div class="grid gap-12 lg:grid-cols-[auto_1fr] lg:gap-24">
        <p v-reveal class="eyebrow lg:pt-4">Sonra ne oluyor</p>

        <ol class="grid gap-px bg-f-rule sm:grid-cols-3">
          <li
            v-for="(step, index) in STEPS"
            :key="step.title"
            v-reveal="index"
            class="flex flex-col gap-3 bg-f-linen p-8"
          >
            <span class="index-numeral text-display-sm text-f-brass">
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <h3 class="display text-xl text-f-ink">{{ step.title }}</h3>
            <p class="text-f-ink-muted">{{ step.text }}</p>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const STEPS = [
  {
    title: 'Arıyorsunuz',
    text: 'Ne yaptırmak istediğinizi kabaca anlatmanız yeterli. Ölçü vermenize gerek yok.',
  },
  {
    title: 'Keşfe geliyoruz',
    text: 'Uygun bir gün belirleyip mekâna geliyor, ölçüyü kendimiz alıyoruz. Ücretsiz.',
  },
  {
    title: 'Çizimi görüyorsunuz',
    text: 'Üç boyutlu çizim ve fiyat birlikte geliyor. Onaylamadan üretim başlamıyor.',
  },
];
</script>
