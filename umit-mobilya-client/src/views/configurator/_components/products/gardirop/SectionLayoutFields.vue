<template>
  <section class="p-6 md:p-7">
    <h2 class="font-serif text-2xl text-f-ink">6 — Özel düzen</h2>

    <div class="mt-4 bg-f-linen p-5">
      <p class="text-sm font-medium text-f-ink">
        {{ sectionLabel(config.sectionCount, active) }}
      </p>

      <div class="mt-4 border-b border-f-rule pb-4">
        <label class="flex items-center gap-3">
          <span class="flex-1 text-sm text-f-ink-muted">Bölüm genişliği</span>
          <InputNumber
            v-model="width"
            :min="range.min"
            :max="range.max"
            suffix=" cm"
            input-class="!w-28 !px-3"
          />
        </label>

        <Slider
          v-model="width"
          :min="range.min"
          :max="range.max"
          :step="0.5"
          class="mt-5"
        />

        <div class="mt-2 flex justify-between text-sm text-f-ink-faint">
          <span>{{ range.min }} cm</span>
          <span>{{ range.max }} cm</span>
        </div>
      </div>

      <p class="mt-3 text-sm text-f-ink-faint">
        Bu bölümü büyütmek diğerlerini daraltmaz — gövde genişler. Şu an gövde
        <strong class="text-f-ink">{{ config.width }} cm</strong>.
      </p>

      <div class="mt-4 flex flex-col gap-3">
        <SectionFittingRow
          v-for="(_, index) in section.shelves"
          :key="`shelf-${index}`"
          v-model="section.shelves[index]"
          :label="`Raf ${index + 1} — üstten`"
          :max="config.height"
          @remove="section.shelves.splice(index, 1)"
        />

        <SectionFittingRow
          v-for="(_, index) in section.rails"
          :key="`rail-${index}`"
          v-model="section.rails[index]"
          :label="`Askılık ${index + 1} — üstten`"
          :max="config.height"
          @remove="section.rails.splice(index, 1)"
        />

        <label class="flex items-center gap-3">
          <span class="flex-1 text-sm text-f-ink-muted">Çekmece adedi</span>
          <InputNumber
            v-model="drawers"
            :min="DRAWER_LIMIT.min"
            :max="DRAWER_LIMIT.max"
            show-buttons
            input-class="!w-16 !px-3"
          />
        </label>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <Button
        size="small"
        severity="secondary"
        variant="outlined"
        class="!rounded-none"
        @click="section.shelves.push(100)"
      >
        + Raf ekle
      </Button>
      <Button
        size="small"
        severity="secondary"
        variant="outlined"
        class="!rounded-none"
        @click="section.rails.push(60)"
      >
        + Askılık ekle
      </Button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { setSectionWidth } from '../../../_etc/dimensionOps';
import { sectionWidthRange } from '../../../_etc/geometry/sectionWidths';
import { setDrawers } from '../../../_etc/products/gardirop/configOps';
import { DRAWER_LIMIT, LIMITS } from '../../../_etc/products/gardirop/options';
import { sectionLabel } from '../../../_etc/sectionLabel';
import SectionFittingRow from '../../panel/SectionFittingRow.vue';

import type { IGardiropConfig } from '../../../_etc/products/gardirop/types';

interface IProps {
  active: number;
}

const props = defineProps<IProps>();

const config = defineModel<IGardiropConfig>({ required: true });

const section = computed(
  () => config.value.sections[props.active] ?? config.value.sections[0],
);

const range = computed(() => sectionWidthRange(config.value, props.active, LIMITS.width));

const width = computed({
  get: () => section.value.width,
  set: (value: number) => setSectionWidth(config.value, props.active, value, LIMITS.width),
});

const drawers = computed({
  get: () => section.value.drawers,
  set: (value: number) => setDrawers(config.value, props.active, value),
});
</script>
