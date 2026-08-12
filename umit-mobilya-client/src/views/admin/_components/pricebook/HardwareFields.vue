<template>
  <section class="flex flex-col gap-4">
    <header>
      <h2 class="font-serif text-2xl text-f-ink">Donanım</h2>
      <p class="mt-1 text-sm text-f-ink-muted">
        Her kalem ayrı fiyatlanır. <strong>Çekmece adet fiyatı rayı ve
        malzemesini içerir</strong> — ray için ayrı satır yok.
      </p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2">
      <label class="flex flex-col gap-2">
        <span class="eyebrow">Menteşe (adet)</span>
        <InputNumber v-model="hardware.hinge.pricePerUnit" :min="0" suffix=" ₺" />
      </label>

      <label class="flex flex-col gap-2">
        <span class="eyebrow">Kulp (adet)</span>
        <InputNumber v-model="hardware.handle.pricePerUnit" :min="0" suffix=" ₺" />
      </label>

      <label class="flex flex-col gap-2">
        <span class="eyebrow">Çekmece (adet, ray dahil)</span>
        <InputNumber v-model="hardware.drawer.pricePerUnit" :min="0" suffix=" ₺" />
      </label>

      <label class="flex flex-col gap-2">
        <span class="eyebrow">Askılık borusu (metre)</span>
        <InputNumber v-model="hardware.rail.pricePerM" :min="0" suffix=" ₺" />
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { IHardware } from '@/views/configurator/_etc/pricing/priceBook';

const hardware = defineModel<IHardware>({ required: true });
</script>
