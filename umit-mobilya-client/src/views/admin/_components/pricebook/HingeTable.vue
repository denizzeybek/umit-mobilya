<template>
  <section class="flex flex-col gap-4">
    <header>
      <h2 class="font-serif text-2xl text-f-ink">Menteşe adedi</h2>
      <p class="mt-1 text-sm text-f-ink-muted">
        Kanat <strong>yüksekliğine</strong> göre okunur, genişliğine göre
        değil. Bir kanat hangi kademeye düşerse o kadar menteşe alır.
      </p>
    </header>

    <DataTable :value="rows" size="small" class="admin-table">
      <Column header="Bu yüksekliğe kadar">
        <template #body="{ data }">
          <InputNumber v-model="data.maxHeightCm" suffix=" cm" :min="1" class="w-32" />
        </template>
      </Column>
      <Column header="Menteşe">
        <template #body="{ data }">
          <InputNumber v-model="data.count" :min="1" :max="12" class="w-24" showButtons />
        </template>
      </Column>
    </DataTable>
  </section>
</template>

<script setup lang="ts">
import type { IHingeStep } from '@/views/configurator/_etc/pricing/priceBook';

const rows = defineModel<IHingeStep[]>({ required: true });
</script>

<style scoped>
.admin-table :deep(.p-datatable-thead > tr > th) {
  @apply border-b border-f-rule bg-transparent text-[0.68rem] font-medium uppercase tracking-[0.14em] text-f-ink-muted;
}

.admin-table :deep(.p-datatable-tbody > tr > td) {
  @apply border-b border-f-rule/60 py-2.5;
}

.admin-table :deep(.p-datatable-tbody > tr:last-child > td) {
  @apply border-b-0;
}
</style>
