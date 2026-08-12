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
</template>

<script setup lang="ts">
import {
  applyLayout,
  clearSection,
} from '../../../_etc/products/gardirop/configOps';
import { PRESETS } from '../../../_etc/products/gardirop/options';

import type { IGardiropConfig } from '../../../_etc/products/gardirop/types';

interface IProps {
  active: number;
}

defineProps<IProps>();

const config = defineModel<IGardiropConfig>({ required: true });
</script>
