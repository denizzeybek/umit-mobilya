<template>
  <section
    class="mx-auto flex min-h-[70svh] max-w-editorial flex-col justify-center px-5 py-section md:px-10"
    data-testid="not-found"
  >
    <p class="eyebrow">404</p>
    <h1 class="display mt-6 max-w-[16ch] text-display-lg text-f-ink">
      Bu sayfa yok.
    </h1>
    <p class="prose-lede mt-6 max-w-prose">
      Adres yanlış yazılmış ya da sayfa kaldırılmış olabilir. Aşağıdan devam
      edebilirsiniz.
    </p>

    <nav class="mt-12 flex flex-wrap gap-3" aria-label="Kurtarma bağlantıları">
      <RouterLink
        :to="{ name: ERouteNames.Dashboard }"
        class="bg-f-primary px-7 py-4 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-paper transition-colors duration-300 hover:bg-f-primary-hovered"
      >
        Ana Sayfa
      </RouterLink>
      <RouterLink
        :to="{ name: ERouteNames.ProductsList }"
        class="border border-f-rule-strong px-7 py-4 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-ink transition-colors duration-300 hover:border-f-primary"
      >
        İşler
      </RouterLink>
      <RouterLink
        :to="{ name: ERouteNames.Contact }"
        class="border border-f-rule-strong px-7 py-4 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-ink transition-colors duration-300 hover:border-f-primary"
      >
        İletişim
      </RouterLink>
    </nav>
  </section>
</template>

<script setup lang="ts">
import { ERouteNames } from '@/router/routeNames.enum';
</script>
