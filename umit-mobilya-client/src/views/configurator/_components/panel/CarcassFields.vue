<template>
  <section class="p-6 md:p-7">
    <h2 class="font-serif text-2xl text-f-ink">3 — Gövde ve kapak</h2>

    <div class="mt-4 grid grid-cols-2 gap-3">
      <label class="flex flex-col gap-2">
        <span class="eyebrow">Arkalık</span>
        <Select
          v-model="config.backPanel"
          :options="BACK_PANELS"
          option-label="label"
          option-value="id"
          class="w-full"
        />
      </label>

      <label class="flex flex-col gap-2">
        <span class="eyebrow">Kapak</span>
        <Select
          v-model="config.doorStyle"
          :options="DOOR_STYLES"
          option-label="label"
          option-value="id"
          class="w-full"
        />
      </label>
    </div>

    <label
      v-if="config.doorStyle !== 'yok'"
      class="mt-6 flex flex-col gap-4"
    >
      <span class="eyebrow">Kapakları aç / kapat</span>
      <Slider v-model="config.doorOpen" :min="0" :max="1" :step="0.01" />
    </label>
  </section>
</template>

<script setup lang="ts">
import { BACK_PANELS, DOOR_STYLES } from '../../_etc/catalog';

import type { IBaseConfig } from '../../_etc/types';

const config = defineModel<IBaseConfig>({ required: true });
</script>
