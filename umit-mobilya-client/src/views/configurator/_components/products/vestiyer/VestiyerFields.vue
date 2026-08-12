<template>
  <section class="p-6 md:p-7">
    <h2 class="font-serif text-2xl text-f-ink">5 — Hazır düzen</h2>

    <div class="mt-4 flex flex-wrap gap-2">
      <Button
        v-for="preset in PRESETS"
        :key="preset.id"
        size="small"
        severity="secondary"
        variant="outlined"
        class="!rounded-none"
        @click="applyLayout(config, active, preset.build())"
      >
        {{ preset.label }}
      </Button>

      <Button
        size="small"
        severity="danger"
        variant="outlined"
        class="!rounded-none"
        @click="clearSection(config, active)"
      >
        İçini boşalt
      </Button>
    </div>
  </section>

  <section class="p-6 md:p-7">
    <h2 class="font-serif text-2xl text-f-ink">6 — Özel düzen</h2>

    <div class="mt-4 flex flex-col gap-4 bg-f-linen p-5">
      <p class="text-sm font-medium text-f-ink">
        {{ sectionLabel(config.sectionCount, active) }}
      </p>

      <label class="flex items-center gap-3">
        <span class="flex-1 text-sm text-f-ink-muted">Oturak</span>
        <ToggleSwitch v-model="hasBench" />
      </label>

      <label v-if="hasBench" class="flex items-center gap-3">
        <span class="flex-1 text-sm text-f-ink-muted">
          Oturak yüksekliği — zeminden
        </span>
        <InputNumber
          v-model="benchHeight"
          :min="30"
          :max="Math.round(config.height * 0.6)"
          suffix=" cm"
          input-class="!w-24 !px-3"
        />
      </label>

      <label v-if="hasBench" class="flex items-center gap-3">
        <span class="flex-1 text-sm text-f-ink-muted">Ayakkabılık rafı</span>
        <InputNumber
          v-model="shoeShelves"
          :min="SHOE_SHELF_LIMIT.min"
          :max="SHOE_SHELF_LIMIT.max"
          show-buttons
          input-class="!w-16 !px-3"
        />
      </label>

      <label class="flex items-center gap-3">
        <span class="flex-1 text-sm text-f-ink-muted">Askı çıtası</span>
        <ToggleSwitch v-model="hasHooks" />
      </label>

      <label v-if="hasHooks" class="flex items-center gap-3">
        <span class="flex-1 text-sm text-f-ink-muted">
          Askı çıtası — üstten
        </span>
        <InputNumber
          v-model="hookRail"
          :min="0"
          :max="config.height"
          suffix=" cm"
          input-class="!w-24 !px-3"
        />
      </label>

      <div class="flex flex-col gap-3 border-t border-f-rule pt-4">
        <SectionFittingRow
          v-for="(_, index) in section.shelves"
          :key="`shelf-${index}`"
          v-model="section.shelves[index]"
          :label="`Raf ${index + 1} — üstten`"
          :max="config.height"
          @remove="section.shelves.splice(index, 1)"
        />

        <Button
          size="small"
          severity="secondary"
          variant="outlined"
          class="!rounded-none self-start"
          @click="section.shelves.push(60)"
        >
          + Raf ekle
        </Button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import {
  applyLayout,
  clearSection,
  setBench,
  setHookRail,
  setShoeShelves,
} from '../../../_etc/products/vestiyer/configOps';
import {
  PRESETS,
  SHOE_SHELF_LIMIT,
} from '../../../_etc/products/vestiyer/options';
import { sectionLabel } from '../../../_etc/sectionLabel';
import SectionFittingRow from '../../panel/SectionFittingRow.vue';

import type { IVestiyerConfig } from '../../../_etc/products/vestiyer/types';

interface IProps {
  active: number;
}

const props = defineProps<IProps>();

const config = defineModel<IVestiyerConfig>({ required: true });

const section = computed(
  () => config.value.sections[props.active] ?? config.value.sections[0],
);

const hasBench = computed({
  get: () => section.value.benchFromFloor !== null,
  set: (value: boolean) =>
    setBench(config.value, props.active, value ? 45 : null),
});

const benchHeight = computed({
  get: () => section.value.benchFromFloor ?? 45,
  set: (value: number) => setBench(config.value, props.active, value),
});

const shoeShelves = computed({
  get: () => section.value.shoeShelves,
  set: (value: number) => setShoeShelves(config.value, props.active, value),
});

const hasHooks = computed({
  get: () => section.value.hookRail !== null,
  set: (value: boolean) =>
    setHookRail(config.value, props.active, value ? 60 : null),
});

const hookRail = computed({
  get: () => section.value.hookRail ?? 60,
  set: (value: number) => setHookRail(config.value, props.active, value),
});
</script>
