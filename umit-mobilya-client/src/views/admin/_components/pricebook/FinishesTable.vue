<template>
  <section class="flex flex-col gap-4">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="font-serif text-2xl text-f-ink">Kaplamalar</h2>
        <p class="mt-1 text-sm text-f-ink-muted">
          Yüzey işlemi; ek ücret panel alanı üstünden işler. Buradaki renkler
          <strong>ürün kaplaması</strong>, arayüz teması değil — seçilen renk
          hem paneldeki daireye hem 3B sahnedeki panele gidiyor. Desen
          yüklenirse dolap o desenle çiziliyor; renk o zaman deseni tonlayan
          bir çarpan oluyor.
        </p>
      </div>

      <Button
        label="Kaplama ekle"
        icon="pi pi-plus"
        severity="secondary"
        outlined
        size="small"
        @click="handleAdd"
      />
    </header>

    <DataTable :value="rows" data-key="id" size="small" class="admin-table">
      <Column field="label" header="Etiket">
        <template #body="{ data }">
          <InputText v-model="data.label" class="w-44" />
        </template>
      </Column>
      <Column header="Kimlik">
        <template #body="{ data }">
          <!--
            Salt okunur ve bilerek görünür: bu kimlik paylaşılmış bağlantılarda
            ve dondurulmuş tekliflerde duruyor. Değiştirilebilseydi ikisi de
            çözümsüz kalırdı.
          -->
          <code class="text-xs text-f-ink-muted">{{ data.id }}</code>
        </template>
      </Column>

      <Column header="Renk">
        <template #body="{ data }">
          <div class="flex items-center gap-3">
            <ColorPicker
              :model-value="data.swatch"
              format="hex"
              @update:model-value="(value?: string) => applyColor(data, value)"
            />
            <!--
              `change`, `update:model-value` DEĞİL: her tuşta yazmak alanı
              bozuyordu. `#2F6` yazılırken ara değer geçerli üç haneli bir renk
              ve normalleştirilmiş hâli (`#22FF66`) kutuya geri yazılıyor,
              kalan tuşlar onun üstüne biniyordu — `#2F6B4F` yazmak isteyen
              `#22FF66B4F` alıyordu. Şimdi değer alandan çıkınca okunuyor.
            -->
            <InputText
              :model-value="data.swatch"
              class="w-28 font-mono text-xs"
              @change="(event: Event) => applyColorFromInput(data, event)"
            />
          </div>
        </template>
      </Column>
      <Column header="Desen">
        <template #body="{ data }">
          <FinishTextureCell :finish="data" @update="replaceRow" />
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
import {
  nextCustomFinishId,
  toColorNumber,
  toSwatch,
} from '@/views/admin/_etc/colorValue';

import FinishTextureCell from './FinishTextureCell.vue';

import type { IFinish } from '@/views/configurator/_etc/pricing/priceBook';

const rows = defineModel<IFinish[]>({ required: true });

/**
 * `swatch` ile `color` birlikte yazılıyor. İkisini ayrı ayrı düzenlenebilir
 * bırakmak, panelde bir renk 3B sahnede başka bir renk göstermenin en kısa
 * yoluydu.
 *
 * Okunamayan bir değerde HİÇBİR ŞEY yazılmıyor: admin `#ab` yazarken ara
 * durumlar geçersiz oluyor ve her tuşta rengi siyaha düşürmek, yazmayı
 * imkânsız kılardı.
 */
const applyColor = (row: IFinish, value?: string): void => {
  const color = toColorNumber(value ?? '');
  if (color === null) return;

  row.color = color;
  row.swatch = toSwatch(color);
};

/**
 * Desen hücresi satırı yerinde değiştirmiyor, yenisini veriyor; burada kimliğe
 * göre takas ediliyor. Kimlik hiç değişmediği için eşleşme güvenli.
 */
const replaceRow = (finish: IFinish): void => {
  rows.value = rows.value.map((row) => (row.id === finish.id ? finish : row));
};

/** Metin kutusundan gelen değer; `event.target` daraltılıyor, cast yok. */
const applyColorFromInput = (row: IFinish, event: Event): void => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  applyColor(row, target.value);
};

/**
 * Yeni kaplama LİSTEDE KAPALI başlıyor. Yayınlanan bir fiyat kitabı
 * konfigüratöre anında gidiyor; adı ve rengi henüz girilmemiş bir daireyi
 * müşteriye göstermek, yarım kalmış bir düzenlemeyi vitrine koymak olurdu.
 */
const handleAdd = (): void => {
  rows.value = [
    ...rows.value,
    {
      id: nextCustomFinishId(rows.value.map((row) => row.id)),
      label: 'Yeni kaplama',
      color: 0xd9d2c7,
      swatch: toSwatch(0xd9d2c7),
      surchargePerM2: 0,
      hidden: true,
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
