<template>
  <section class="mx-auto max-w-editorial px-5 py-section md:px-10">
    <div class="border-b border-f-rule pb-8">
      <p class="eyebrow">Bize ulaşın</p>
      <h2 class="display mt-5 max-w-[20ch] text-display-md text-f-ink">
        İki adres, iki numara. Hangisi yakınsa oraya.
      </h2>
    </div>

    <div class="grid gap-px bg-f-rule md:grid-cols-2">
      <article
        v-for="(location, index) in LOCATIONS"
        :key="location.label"
        v-reveal="index"
        class="flex flex-col gap-6 bg-f-bone p-8 md:p-12"
      >
        <div class="flex items-baseline gap-4">
          <span class="index-numeral text-sm text-f-brass">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <h3 class="display text-display-sm text-f-ink">
            {{ location.label }}
          </h3>
        </div>

        <address class="not-italic text-f-ink-muted">
          {{ location.address }}<br />
          {{ location.district }}
        </address>

        <a
          :href="location.phoneHref"
          class="group flex w-fit items-baseline gap-3 border-b border-f-rule-strong pb-2 text-2xl text-f-ink transition-colors duration-300 hover:border-f-brass hover:text-f-primary"
        >
          {{ location.phone }}
          <span
            class="text-sm text-f-ink-faint transition-transform duration-300 group-hover:translate-x-1"
          >
            ara →
          </span>
        </a>

        <div class="mt-auto flex flex-wrap gap-3 pt-4">
          <a
            :href="location.mapsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-f-rule-strong px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-ink transition-colors duration-300 hover:border-f-primary hover:bg-f-primary hover:text-f-paper"
          >
            Yol Tarifi
          </a>
          <a
            :href="WHATSAPP_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-f-rule-strong px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-ink transition-colors duration-300 hover:border-f-primary hover:bg-f-primary hover:text-f-paper"
          >
            WhatsApp
          </a>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { LOCATIONS, WHATSAPP_URL } from '@/constants/company';
</script>
