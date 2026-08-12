<template>
  <section class="flex flex-col gap-4">
    <header>
      <h2 class="font-serif text-2xl text-f-ink">Genel giderler</h2>
    </header>

    <div class="grid gap-4 sm:grid-cols-2">
      <label class="flex flex-col gap-2">
        <span class="eyebrow">Kâr marjı çarpanı</span>
        <InputNumber v-model="book.margin.multiplier" :min="1" :maxFractionDigits="2" />
        <span class="text-xs text-f-ink-muted">
          Müşteriye <strong>satır olarak gösterilmez</strong>, toplama gömülür.
        </span>
      </label>

      <label class="flex flex-col gap-2">
        <span class="eyebrow">KDV oranı</span>
        <InputNumber
          :model-value="book.vat.rate * 100"
          :min="0"
          :max="100"
          suffix=" %"
          @update:model-value="(value: number) => (book.vat.rate = (value ?? 0) / 100)"
        />
      </label>

      <label class="flex flex-col gap-2">
        <span class="eyebrow">Kenar bandı (metre)</span>
        <InputNumber v-model="book.edgeBand.pricePerM" :min="0" suffix=" ₺" />
      </label>

      <label class="flex flex-col gap-2">
        <span class="eyebrow">Fire payı</span>
        <InputNumber v-model="book.waste.percent" :min="0" :max="50" suffix=" %" />
      </label>

      <label class="flex flex-col gap-2">
        <span class="eyebrow">Nakliye ve montaj</span>
        <div class="flex items-center gap-3">
          <ToggleSwitch v-model="book.delivery.enabled" />
          <InputNumber
            v-model="book.delivery.flat"
            :min="0"
            suffix=" ₺"
            :disabled="!book.delivery.enabled"
          />
        </div>
        <span class="text-xs text-f-ink-muted">
          Kapalıyken dökümde satır açılmaz.
        </span>
      </label>

      <label class="flex flex-col gap-2">
        <span class="eyebrow">Alan hesabı</span>
        <SelectButton
          v-model="book.areaConvention"
          :options="CONVENTIONS"
          option-label="label"
          option-value="id"
          :allow-empty="false"
        />
        <span class="text-xs text-f-ink-muted">
          Brüt: modülün dış ölçüsü. Net: gerçek kesim ölçüsü.
        </span>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { IPriceBook } from '@/views/configurator/_etc/pricing/priceBook';

const book = defineModel<IPriceBook>({ required: true });

const CONVENTIONS = [
  { id: 'gross', label: 'Brüt' },
  { id: 'net', label: 'Net' },
];
</script>
