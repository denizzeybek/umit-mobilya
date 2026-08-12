<template>
  <section class="flex flex-col gap-4">
    <header>
      <h2 class="font-serif text-2xl text-f-ink">Kapak tipleri</h2>
      <p class="mt-1 text-sm text-f-ink-muted">
        Malzemeden bağımsız ikinci eksen: aynı panel, aynalı kapak olarak
        farklı fiyatlanır. Hepsi m² üstünden.
      </p>
    </header>

    <DataTable :value="rows" data-key="id" size="small" class="admin-table">
      <Column field="label" header="Etiket">
        <template #body="{ data }">
          <InputText v-model="data.label" class="w-44" />
        </template>
      </Column>
      <Column field="pricePerM2" header="₺ / m² farkı">
        <template #body="{ data }">
          <InputNumber v-model="data.pricePerM2" :min="0" class="w-32" />
        </template>
      </Column>
      <Column header="Kulp içerir">
        <template #body="{ data }">
          <ToggleSwitch v-model="data.includesHandle" />
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

    <p class="text-sm text-f-ink-muted">
      "Kulp içerir" açıkken kulp <strong>ayrı kalem</strong> olarak eklenir,
      kapak fiyatına gömülmez — yoksa aynı kulp iki kez fiyatlanırdı.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { IDoorType } from '@/views/configurator/_etc/pricing/priceBook';

const rows = defineModel<IDoorType[]>({ required: true });
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
