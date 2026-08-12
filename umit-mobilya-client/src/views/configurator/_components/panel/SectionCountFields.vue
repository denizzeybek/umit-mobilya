<template>
  <section class="p-6 md:p-7">
    <h2 class="font-serif text-2xl text-f-ink">4 — Bölüm seç</h2>

    <div class="mt-4 flex flex-col gap-2">
      <span class="eyebrow">Bölüm sayısı</span>
      <SelectButton v-model="count" :options="options" :allow-empty="false" />
    </div>

    <div class="mt-5 flex flex-wrap gap-2">
      <Button
        v-for="(_, index) in config.sectionCount"
        :key="index"
        size="small"
        :severity="active === index ? 'primary' : 'secondary'"
        :variant="active === index ? undefined : 'outlined'"
        class="!rounded-none"
        @click="active = index"
      >
        {{ sectionLabel(config.sectionCount, index) }}
        <span class="opacity-60">· {{ config.sections[index]?.width }} cm</span>
      </Button>
    </div>

    <div class="mt-4">
      <Button
        size="small"
        severity="secondary"
        variant="outlined"
        class="!rounded-none"
        @click="distributeEvenly(config)"
      >
        Eşit dağıt
      </Button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { distributeEvenly, setSectionCount } from '../../_etc/dimensionOps';
import { sectionLabel } from '../../_etc/sectionLabel';

import type {
  IBaseConfig,
  IBaseSection,
  IProductLimits,
} from '../../_etc/types';

/**
 * Bölüm sayısı, hangi bölümün düzenlendiği ve eşit dağıtım — üçü de ürün
 * bilmez. Ürüne özel olan, bölümün İÇİNE ne konduğudur; o kısım ürünün kendi
 * alanlar bileşeninde.
 *
 * Sınırlar ve yeni bölüm fabrikası tanımdan geliyor, import edilmiyor.
 */
interface IProps {
  limits: IProductLimits;
  createSection: (width: number) => IBaseSection;
}

const props = defineProps<IProps>();

const config = defineModel<IBaseConfig>({ required: true });
const active = defineModel<number>('active', { required: true });

const options = computed(() =>
  Array.from(
    {
      length:
        props.limits.sectionCount.max - props.limits.sectionCount.min + 1,
    },
    (_, index) => props.limits.sectionCount.min + index,
  ),
);

const count = computed({
  get: () => config.value.sectionCount,
  set: (value: number) => {
    setSectionCount(config.value, value, props.limits, props.createSection);
    if (active.value > config.value.sectionCount - 1) {
      active.value = config.value.sectionCount - 1;
    }
  },
});
</script>
