<template>
  <div class="flex flex-col gap-10">
    <header class="flex flex-wrap items-baseline justify-between gap-4">
      <div>
        <h2 class="font-serif text-2xl text-f-ink">Fiyat kitabı</h2>
        <p class="mt-1 text-sm text-f-ink-muted">
          Aktif sürüm: <strong>{{ draft.version }}</strong>. Kaydetmek
          <strong>yeni bir sürüm</strong> yazar; eskisi olduğu yerde kalır,
          böylece geçmiş tekliflerin hangi rakamlarla verildiği izlenebilir.
        </p>
      </div>

      <Button
        label="Yeni sürüm yayınla"
        :disabled="pricebookStore.saving"
        :loading="pricebookStore.saving"
        @click="handlePublish"
      />
    </header>

    <MaterialsTable v-model="draft.materials" />
    <DoorTypesTable v-model="draft.doorTypes" />
    <FinishesTable v-model="draft.finishes" />
    <HardwareFields v-model="draft.hardware" />
    <HingeTable v-model="draft.hardware.hinge.countByDoorHeight" />
    <LabourFields v-model="draft.labour" />
    <OverheadFields v-model="draft" />
    <LimitFields v-model="draft" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useFToast } from '@/composables/useFToast';
import { usePricebookStore } from '@/stores/pricebook';
import { DEFAULT_PRICE_BOOK } from '@/views/configurator/_etc/pricing/defaults';

import DoorTypesTable from '../_components/pricebook/DoorTypesTable.vue';
import FinishesTable from '../_components/pricebook/FinishesTable.vue';
import HardwareFields from '../_components/pricebook/HardwareFields.vue';
import HingeTable from '../_components/pricebook/HingeTable.vue';
import LabourFields from '../_components/pricebook/LabourFields.vue';
import LimitFields from '../_components/pricebook/LimitFields.vue';
import MaterialsTable from '../_components/pricebook/MaterialsTable.vue';
import OverheadFields from '../_components/pricebook/OverheadFields.vue';

import type { IPriceBook } from '@/views/configurator/_etc/pricing/priceBook';

/**
 * Düzenleme bir TASLAK üstünde: store'daki kitap yayınlanana kadar
 * değişmiyor, böylece yarım kalan bir düzenleme konfigüratörün gördüğü
 * kataloğu bozmuyor.
 *
 * Kâr marjı public cevapta olmadığı için taslağa tohum kitaptan geliyor.
 */
const pricebookStore = usePricebookStore();
const { showErrorMessage, showSuccessMessage } = useFToast();

const draft = ref<IPriceBook>(structuredClone(DEFAULT_PRICE_BOOK));

async function handlePublish() {
  try {
    await pricebookStore.publish(draft.value);
    showSuccessMessage(`Sürüm ${pricebookStore.book.version} yayınlandı.`);
  } catch (error) {
    showErrorMessage(error);
  }
}

onMounted(async () => {
  try {
    const book = await pricebookStore.fetch();
    draft.value = structuredClone({
      ...DEFAULT_PRICE_BOOK,
      ...book,
      margin: book.margin ?? DEFAULT_PRICE_BOOK.margin,
    });
  } catch (error) {
    showErrorMessage(error);
  }
});
</script>
