<template>
  <section class="p-6 md:p-7">
    <h2 class="font-serif text-2xl text-f-ink">2 — Ölçü</h2>

    <div class="mt-4 grid grid-cols-3 gap-3">
      <label class="flex flex-col gap-2">
        <span class="eyebrow">Genişlik</span>
        <InputNumber
          v-model="width"
          :min="limits.width.min"
          :max="limits.width.max"
          :step="limits.width.step"
          suffix=" cm"
          :input-class="INPUT_CLASS"
          fluid
        />
      </label>

      <label class="flex flex-col gap-2">
        <span class="eyebrow">Yükseklik</span>
        <InputNumber
          v-model="height"
          :min="limits.height.min"
          :max="limits.height.max"
          :step="limits.height.step"
          suffix=" cm"
          :input-class="INPUT_CLASS"
          fluid
        />
      </label>

      <label class="flex flex-col gap-2">
        <span class="eyebrow">Derinlik</span>
        <InputNumber
          v-model="depth"
          :min="limits.depth.min"
          :max="limits.depth.max"
          :step="limits.depth.step"
          suffix=" cm"
          :input-class="INPUT_CLASS"
          fluid
        />
      </label>
    </div>

    <p class="mt-3 text-sm text-f-ink-faint">
      Genişlik {{ limits.width.min }}–{{ limits.width.max }}, yükseklik
      {{ limits.height.min }}–{{ limits.height.max }}, derinlik
      {{ limits.depth.min }}–{{ limits.depth.max }} cm arası. Genişlik
      bölümlerden türetilir; buraya yazılan ölçü bölümlere oranla dağıtılır.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import {
  setDepth,
  setHeight,
  setTotalWidth,
} from '../../_etc/dimensionOps';

import type { IBaseConfig, IProductLimits } from '../../_etc/types';

interface IProps {
  limits: IProductLimits;
}

const props = defineProps<IProps>();

const limits = props.limits;

const config = defineModel<IBaseConfig>({ required: true });

const INPUT_CLASS = '!w-full !px-3';

const width = computed({
  get: () => config.value.width,
  set: (value: number) => setTotalWidth(config.value, value, limits.width),
});

const height = computed({
  get: () => config.value.height,
  set: (value: number) => setHeight(config.value, value, limits.height),
});

const depth = computed({
  get: () => config.value.depth,
  set: (value: number) => setDepth(config.value, value, limits.depth),
});
</script>
