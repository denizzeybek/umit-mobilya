<template>
  <footer class="bg-f-primary text-f-bone">
    <div class="mx-auto max-w-editorial px-5 md:px-10">
      <div
        class="grid gap-10 border-b border-f-bone/15 py-section lg:grid-cols-[1.2fr_1fr] lg:items-end"
      >
        <div>
          <p class="eyebrow !text-f-brass-light">Bir sonraki iş</p>
          <h2 class="display mt-6 text-display-lg text-f-bone">
            Aklınızdaki işi<br />
            birlikte ölçelim.
          </h2>
        </div>

        <div class="flex flex-col gap-5 lg:items-end">
          <p class="max-w-prose text-f-bone/70 lg:text-right">
            Keşif ücretsiz. Ölçüyü biz alır, üretime girmeden önce üç boyutlu
            çizimle gösteririz.
          </p>
          <div class="flex flex-wrap gap-3">
            <RouterLink
              :to="{ name: ERouteNames.Contact }"
              class="bg-f-bone px-7 py-4 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-primary transition-colors duration-300 hover:bg-f-brass-light"
            >
              Teklif Al
            </RouterLink>
            <a
              :href="WHATSAPP_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="border border-f-bone/30 px-7 py-4 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-bone transition-colors duration-300 hover:border-f-bone"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div class="grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="location in LOCATIONS"
          :key="location.label"
          class="flex flex-col gap-3"
        >
          <p class="eyebrow !text-f-brass-light">{{ location.label }}</p>
          <p class="text-f-bone/70">
            {{ location.address }}<br />
            {{ location.district }}
          </p>
          <a
            :href="location.phoneHref"
            class="w-fit border-b border-f-bone/30 pb-1 text-lg text-f-bone transition-colors duration-300 hover:border-f-brass-light hover:text-f-brass-light"
          >
            {{ location.phone }}
          </a>
          <a
            :href="location.mapsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="w-fit text-sm text-f-bone/60 transition-colors duration-300 hover:text-f-bone"
          >
            Yol tarifi al →
          </a>
        </div>

        <nav class="flex flex-col gap-3" aria-label="Alt menü">
          <p class="eyebrow !text-f-brass-light">Site</p>
          <RouterLink
            v-for="link in footerLinks"
            :key="link.name"
            :to="{ name: link.name }"
            class="w-fit text-f-bone/70 transition-colors duration-300 hover:text-f-bone"
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <div class="flex flex-col gap-3">
          <p class="eyebrow !text-f-brass-light">Ne yapıyoruz</p>
          <p class="text-f-bone/70">
            Mutfak, gardırop, TV ünitesi, banyo dolabı, vestiyer ve kitaplık.
            Hepsi mekâna göre, tek tek üretiliyor.
          </p>
        </div>
      </div>

      <div
        class="flex flex-col items-center justify-between gap-6 border-t border-f-bone/15 py-8 md:flex-row"
      >
        <img
          src="/umit-mobilya-logo-beyaz.png"
          :alt="COMPANY_NAME"
          class="h-9 w-auto opacity-90"
        />
        <p class="text-sm text-f-bone/50">
          © {{ year }} {{ COMPANY_NAME }} · Kuşadası, Aydın
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import {
  COMPANY_NAME,
  LOCATIONS,
  WHATSAPP_URL,
} from '@/constants/company';
import { ERouteNames } from '@/router/routeNames.enum';

const footerLinks = [
  { name: ERouteNames.Dashboard, label: ERouteNames.Dashboard },
  { name: ERouteNames.ProductsList, label: 'İşler' },
  { name: ERouteNames.About, label: ERouteNames.About },
  { name: ERouteNames.Contact, label: ERouteNames.Contact },
];

const year = computed(() => new Date().getFullYear());
</script>
