<template>
  <section class="flex flex-col gap-4">
    <header class="flex items-baseline justify-between gap-4">
      <div>
        <h2 class="font-serif text-2xl text-f-ink">Malzemeler</h2>
        <p class="mt-1 text-sm text-f-ink-muted">
          Gövde ve kapak panellerinin ikisi de buradaki m² fiyatından
          hesaplanır. Kalınlık fiyatın parçası — 18 mm ve 8 mm ayrı satır.
        </p>
      </div>
      <Button label="Malzeme ekle" size="small" outlined @click="addRow" />
    </header>

    <DataTable :value="rows" data-key="id" size="small" class="admin-table">
      <Column field="id" header="Kimlik">
        <template #body="{ data }">
          <InputText v-model="data.id" class="w-40" />
        </template>
      </Column>
      <Column field="label" header="Etiket">
        <template #body="{ data }">
          <InputText v-model="data.label" class="w-44" />
        </template>
      </Column>
      <Column field="thicknessMm" header="Kalınlık">
        <template #body="{ data }">
          <InputNumber v-model="data.thicknessMm" suffix=" mm" :min="1" :max="60" class="w-28" />
        </template>
      </Column>
      <Column field="pricePerM2" header="₺ / m²">
        <template #body="{ data }">
          <InputNumber v-model="data.pricePerM2" :min="0" class="w-32" />
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
      Kapatılan malzeme seçim listesinden çıkar ama <strong>silinmez</strong>:
      paylaşılmış bir tasarım bağlantısı ya da geçmiş bir teklif o kimliği
      taşıyor olabilir.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { IMaterial } from '@/views/configurator/_etc/pricing/priceBook';

const rows = defineModel<IMaterial[]>({ required: true });

const addRow = () => {
  rows.value = [
    ...rows.value,
    {
      id: '',
      label: '',
      thicknessMm: 18,
      pricePerM2: 0,
      roughness: 0.5,
      clearcoat: 0.2,
    },
  ];
};
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
