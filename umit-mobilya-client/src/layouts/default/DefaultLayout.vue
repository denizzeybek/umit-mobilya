<template>
  <div class="flex min-h-screen flex-col">
    <!--
      Okuma ilerlemesi: sayfanın üstünde pirinç bir kıl çizgi.

      `z-60`, `z-50` DEĞİL: `PageHeader` de `z-50` ve DOM'da bundan SONRA
      geliyor, üstelik kaydırılınca `bg-f-bone/95` alıyor. Aynı yığında eşit
      z-index'te sonraki kazandığı için şerit tam işe yarayacağı anda —
      kaydırma başlayınca — başlığın altında kalıp görünmez oluyordu.
    -->
    <span
      class="scroll-rule pointer-events-none fixed inset-x-0 top-0 z-[60] h-px bg-f-brass-light"
      aria-hidden="true"
    />

    <PageHeader />

    <!--
      Hero'lu sayfalar başlığın altına girer, o yüzden üst boşluk almazlar;
      hero'suz sayfalar başlık yüksekliği kadar itilir. Eski sürümdeki sabit
      mt-[101px] her iki durumu da yanlış çözüyordu.
    -->
    <main
      class="flex-1"
      :class="{ 'pt-[72px] md:pt-[88px]': !hasHero }"
      data-testid="app-main"
    >
      <RouterView />
    </main>

    <SiteFooter />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import PageHeader from './_components/PageHeader.vue';
import SiteFooter from './_components/SiteFooter.vue';

const route = useRoute();

const hasHero = computed(() => Boolean(route.meta.hasHero));
</script>
