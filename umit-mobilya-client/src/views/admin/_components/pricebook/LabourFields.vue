<template>
  <section class="flex flex-col gap-4">
    <header>
      <h2 class="font-serif text-2xl text-f-ink">İşçilik</h2>
      <p class="mt-1 text-sm text-f-ink-muted">
        Üç yöntem de destekleniyor; seçtiğin yönteme ait alanlar görünür.
      </p>
    </header>

    <SelectButton
      v-model="labour.method"
      :options="METHODS"
      option-label="label"
      option-value="id"
      :allow-empty="false"
    />

    <div class="grid gap-4 sm:grid-cols-2">
      <label v-if="labour.method === 'perM2'" class="flex flex-col gap-2">
        <span class="eyebrow">m² başına</span>
        <InputNumber v-model="labour.perM2" :min="0" suffix=" ₺" />
      </label>

      <template v-if="labour.method === 'perHour'">
        <label class="flex flex-col gap-2">
          <span class="eyebrow">Saat ücreti</span>
          <InputNumber v-model="labour.hourlyRate" :min="0" suffix=" ₺" />
        </label>
        <label class="flex flex-col gap-2">
          <span class="eyebrow">m² başına saat</span>
          <InputNumber v-model="labour.hoursPerM2" :min="0" :maxFractionDigits="2" />
        </label>
      </template>

      <label v-if="labour.method === 'percentOfMaterial'" class="flex flex-col gap-2">
        <span class="eyebrow">Malzemenin yüzdesi</span>
        <InputNumber v-model="labour.percentOfMaterial" :min="0" :max="200" suffix=" %" />
      </label>

      <label class="flex flex-col gap-2">
        <span class="eyebrow">Montaj (sabit, opsiyonel)</span>
        <InputNumber v-model="labour.assemblyFlat" :min="0" suffix=" ₺" />
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ILabour } from '@/views/configurator/_etc/pricing/priceBook';

const labour = defineModel<ILabour>({ required: true });

const METHODS = [
  { id: 'perM2', label: 'm² başına' },
  { id: 'perHour', label: 'Saat başına' },
  { id: 'percentOfMaterial', label: 'Malzeme yüzdesi' },
];
</script>
