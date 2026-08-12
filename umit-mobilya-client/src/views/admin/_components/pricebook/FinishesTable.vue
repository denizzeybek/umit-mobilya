<template>
  <section class="flex flex-col gap-4">
    <header>
      <h2 class="font-serif text-2xl text-f-ink">Kaplamalar</h2>
      <p class="mt-1 text-sm text-f-ink-muted">
        Yüzey işlemi; ek ücret panel alanı üstünden işler. Buradaki renkler
        <strong>ürün kaplaması</strong>, arayüz teması değil.
      </p>
    </header>

    <DataTable :value="rows" data-key="id" size="small" class="text-sm">
      <Column field="label" header="Etiket">
        <template #body="{ data }">
          <InputText v-model="data.label" class="w-44" />
        </template>
      </Column>
      <Column header="Renk">
        <template #body="{ data }">
          <span
            class="inline-block h-7 w-7 rounded-full border border-f-rule-strong"
            :style="{ backgroundColor: data.swatch }"
          />
        </template>
      </Column>
      <Column field="surchargePerM2" header="₺ / m² fark">
        <template #body="{ data }">
          <InputNumber v-model="data.surchargePerM2" :min="0" class="w-32" />
        </template>
      </Column>
      <Column header="Listede">
        <template #body="{ data }">
          <ToggleSwitch
            :model-value="!data.hidden"
            @update:model-value="(value: boolean) => (data.hidden = !value)"
          />
        </template>
      </Column>
    </DataTable>
  </section>
</template>

<script setup lang="ts">
import type { IFinish } from '@/views/configurator/_etc/pricing/priceBook';

const rows = defineModel<IFinish[]>({ required: true });
</script>
