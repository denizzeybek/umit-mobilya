<template>
  <section class="relative flex min-h-[92svh] flex-col justify-end overflow-hidden">
    <div class="grain absolute inset-0">
      <FImage
        src="/img/hero-home.webp"
        alt="Meşe mutfak, Ege ışığı"
        img-class="animate-ken-burns"
        sizes="100vw"
        is-eager
        has-variants
        class="h-full w-full"
      />
    </div>

    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-t from-f-ink/80 via-f-ink/25 to-f-ink/30"
      aria-hidden="true"
    />

    <div
      class="relative mx-auto w-full max-w-editorial px-5 pb-16 md:px-10 md:pb-24"
    >
      <p class="eyebrow !text-f-bone/80">
        Kuşadası · Ismarlama üretim
      </p>

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
  </section>
</template>

<script setup lang="ts">
import { ERouteNames } from '@/router/routeNames.enum';
</script>
