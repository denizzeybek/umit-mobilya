<template>
  <section class="p-6 md:p-7">
    <h2 class="font-serif text-2xl text-f-ink">1 — Malzeme</h2>

    <Select
      v-model="config.material"
      :options="materials"
      option-label="label"
      option-value="id"
      class="mt-4 w-full"
    />

    <div class="mt-4 flex gap-3">
      <button
        v-for="item in finishes"
        :key="item.id"
        type="button"
        class="h-11 w-11 rounded-full border-2 transition-transform duration-200 hover:scale-105"
        :class="
          config.finish === item.id
            ? 'border-f-ink ring-2 ring-f-brass ring-offset-2 ring-offset-f-paper'
            : 'border-f-rule-strong'
        "
        :style="{ backgroundColor: item.swatch }"
        :aria-label="item.label"
        :aria-pressed="config.finish === item.id"
        @click="config.finish = item.id"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { DEFAULT_PRICE_BOOK } from '../../_etc/pricing/defaults';

import type { IBaseConfig } from '../../_etc/types';

const config = defineModel<IBaseConfig>({ required: true });

/*
 * Malzeme TEK seçim ve gövdeyle kapağı birlikte fiyatlar. Kapak tipi ayrı bir
 * eksen ve `CarcassFields`'te; ikisi bilerek ayrı, çünkü aynı MDF High Gloss
 * panel aynalı kapak olarak farklı fiyatlanıyor.
 */
const book = DEFAULT_PRICE_BOOK;

const materials = computed(() => book.materials.filter((item) => !item.hidden));

const finishes = computed(() => book.finishes.filter((item) => !item.hidden));
</script>
