<template>
  <!--
    Sahne varken hero YAPIŞKAN: dış bölüm 220svh, içeridekiler ekranı kaplayıp
    yerinde duruyor. Montaj kaydırmayla ilerlediği için bitişini görecek yol
    lazım — 92svh'lik bir hero'da dolap tam kurulduğunda ekrandan çıkmış
    oluyordu, yani bütün mesele kaçırılıyordu.
  -->
  <section
    ref="track"
    class="relative"
    :class="hasScene ? 'h-[220svh] bg-f-void' : ''"
  >
    <div
      class="relative flex flex-col justify-end overflow-hidden"
      :class="hasScene ? 'sticky top-0 h-screen' : 'min-h-[92svh]'"
    >
    <!--
      Poster ve sahne AYNI ANDA basılmaz. Önce fotoğraf açılıp sonra karanlık
      sahnenin üstüne binmesi, sayfayı iki kez açılıyormuş gibi gösteriyordu;
      `hasScene` bu yüzden `onMounted`ta değil kurulum sırasında hesaplanıyor —
      ilk boyada karar zaten verilmiş oluyor ve fotoğraf hiç DOM'a girmiyor.
      Sahne kurulamazsa (`unsupported`) poster geri geliyor.
    -->
    <div v-if="!hasScene" class="grain absolute inset-0">
      <FImage
        src="/img/hero-home.webp"
        alt="Meşe mutfak, Ege ışığı"
        img-class="animate-ken-burns"
        sizes="100vw"
        is-eager
        has-variants
        class="h-full w-full"
        data-testid="hero-poster"
      />
    </div>

    <HeroScene
      v-if="hasScene"
      :track="track"
      @progress="assembly = $event"
      @unsupported="hasScene = false"
    />

    <div
      class="pointer-events-none absolute inset-0"
      :class="
        hasScene
          ? 'bg-gradient-to-r from-f-ink/85 via-f-ink/30 to-transparent'
          : 'bg-gradient-to-t from-f-ink/80 via-f-ink/25 to-f-ink/30'
      "
      aria-hidden="true"
    />

    <div
      class="relative mx-auto w-full max-w-editorial px-5 pb-16 md:px-10 md:pb-24"
      :class="hasScene ? undefined : 'hero-lift'"
    >
      <p class="eyebrow !text-f-bone/80">Kuşadası · Ismarlama üretim</p>

      <h1 class="display mt-6 max-w-[19ch] text-display-xl text-f-bone">
        Mekâna göre yapılır, kataloğa göre değil.
      </h1>

      <p class="prose-lede mt-7 max-w-prose !text-f-bone/80">
        Mutfağı, dolabı, kitaplığı sizin duvarınızın ölçüsüne göre üretiyoruz.
        Keşif ücretsiz, çizim üretimden önce.
      </p>

      <div class="mt-10 flex flex-wrap gap-3">
        <RouterLink
          :to="{ name: ERouteNames.Contact }"
          class="bg-f-bone px-8 py-4 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-ink transition-colors duration-300 hover:bg-f-brass-light"
        >
          Teklif Al
        </RouterLink>
        <RouterLink
          :to="{ name: ERouteNames.ProductsList }"
          class="border border-f-bone/40 px-8 py-4 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-bone transition-colors duration-300 hover:border-f-bone"
        >
          İşlere Bak
        </RouterLink>
      </div>
    </div>

    <!--
      Teknik künye: sahne bir süs değil, üretime giren çizimin ta kendisi.
      Şerit montaj ilerlemesini gösteriyor, yani kaydırdıkça dolabın kurulduğunu
      söyleyen şey yazının kendisi oluyor.
    -->
    <div
      v-if="hasScene"
      class="pointer-events-none absolute bottom-10 right-10 hidden w-56 text-right lg:block"
      aria-hidden="true"
    >
      <span class="eyebrow !text-f-bone/50">Şek. 01 · Gardırop</span>
      <span class="mt-2 block text-xs text-f-bone/40">
        180 × 226 × 60 cm · meşe
      </span>
      <span class="mt-4 block h-px w-full bg-f-bone/15">
        <span
          class="block h-px origin-right bg-f-brass-light transition-transform duration-300 ease-out"
          :style="{ transform: `scaleX(${assembly / 100})` }"
        />
      </span>
      <span class="index-numeral mt-2 block text-xs text-f-bone/40">
        montaj %{{ assembly }}
      </span>
    </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue';

import { ERouteNames } from '@/router/routeNames.enum';

/*
 * `three` ana pakete GİRMEMELİ (tavan 1800 kB, bugün ~1690). Async bileşen
 * ayrı bir parçaya düşüyor ve yalnızca aşağıdaki koşullar tutunca isteniyor.
 */
const HeroScene = defineAsyncComponent(
  () => import('@/components/three/lazy/hero/HeroScene.vue'),
);

/**
 * Sahne gösterilsin mi. İLK BOYADAN ÖNCE, kurulum sırasında karar veriliyor:
 * `onMounted`ta hesaplanınca ilk kare hep posterle çiziliyor ve hemen ardından
 * karanlık sahne üstüne biniyordu — sayfa iki kez açılıyormuş gibi görünüyordu.
 *
 * Dar ekranda sahne hiç yüklenmiyor: kompozisyon metni solda, dolabı sağda
 * varsayıyor ve mobil cihazda bedeli en yüksek, kazancı en düşük yer orası.
 * `saveData` açıksa da yüklenmiyor — kullanıcı zaten baytı kısmamızı istemiş.
 */
const sceneWanted = (): boolean => {
  if (typeof window === 'undefined') return false;

  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  if (connection?.saveData) return false;

  return (
    window.matchMedia('(min-width: 1024px)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
};

const track = ref<HTMLElement | null>(null);
const hasScene = ref(sceneWanted());
const assembly = ref(0);
</script>
