<template>
  <section class="flex flex-col gap-4">
    <header>
      <h2 class="font-serif text-2xl text-f-ink">Ürün sınırları</h2>
      <p class="mt-1 text-sm text-f-ink-muted">
        Yeni ürün <strong>tipi</strong> buradan eklenmez — o bir geometri
        işidir. Burası var olan tiplerin ölçü sınırlarını yönetir.
      </p>
    </header>

    <div v-for="(settings, slug) in book.products" :key="slug" class="border border-f-rule p-4">
      <h3 class="eyebrow">{{ slug }}</h3>

      <div class="mt-3 grid gap-4 sm:grid-cols-2">
        <label class="flex flex-col gap-2">
          <span class="eyebrow">Modül genişlik tavanı</span>
          <InputNumber v-model="settings.maxModuleWidthCm" suffix=" cm" :min="30" :max="400" />
        </label>
        <label class="flex flex-col gap-2">
          <span class="eyebrow">Kapak kanadı tavanı</span>
          <InputNumber v-model="settings.maxDoorLeafWidthCm" suffix=" cm" :min="20" :max="120" />
          <span class="text-xs text-f-ink-muted">
            Kanat sayısını bu belirler; menteşe ve kulp adedi ona bağlı.
          </span>
        </label>
        <label class="flex flex-col gap-2">
          <span class="eyebrow">Köşe modül farkı</span>
          <InputNumber v-model="settings.cornerSurchargePercent" suffix=" %" :min="0" :max="200" />
          <span class="text-xs text-f-ink-muted">
            Köşe işaretli modülün bütün parçalarına uygulanır. 0 = köşe modül
            düz modülle aynı fiyatlanır.
          </span>
        </label>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { IPriceBook } from '@/views/configurator/_etc/pricing/priceBook';

const book = defineModel<IPriceBook>({ required: true });
</script>
