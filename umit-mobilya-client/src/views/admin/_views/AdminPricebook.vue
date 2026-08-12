<template>
  <div class="flex flex-col gap-6 pb-12">
    <!--
      Eylem çubuğu yapışkan: sayfa uzun ve kaydet düğmesi en üstteyken
      aşağıdaki bir alanı değiştiren kişi onu hiç görmüyordu.
    -->
    <header
      class="sticky top-[72px] z-30 -mx-5 flex flex-wrap items-center justify-between gap-4 border-b border-f-rule bg-f-bone/95 px-5 py-4 backdrop-blur-sm md:-mx-10 md:px-10"
    >
      <div>
        <p class="eyebrow">Fiyat kitabı</p>
        <p class="mt-1 text-sm text-f-ink-muted">
          Aktif sürüm <strong class="text-f-ink">{{ draft.version }}</strong>
          <span v-if="isDirty" class="text-f-brass">
            &middot; kaydedilmemiş değişiklik var
          </span>
          <span v-else> &middot; her şey kayıtlı</span>
        </p>
      </div>

      <div class="flex items-center gap-3">
        <Button
          v-if="isDirty"
          label="Geri al"
          severity="secondary"
          text
          size="small"
          @click="reset"
        />
        <Button
          :label="isDirty ? 'Yeni sürüm yayınla' : 'Değişiklik yok'"
          :disabled="!isDirty || pricebookStore.saving"
          :loading="pricebookStore.saving"
          @click="handlePublish"
        />
      </div>
    </header>

    <p class="text-sm text-f-ink-muted">
      Kaydetmek <strong>yeni bir sürüm</strong> yazar; eskisi olduğu yerde
      kalır. Böylece geçmiş tekliflerin hangi rakamlarla verildiği izlenebilir
      ve verilmiş bir teklifin tutarı sonradan değişmez.
    </p>

    <section class="admin-card">
      <MaterialsTable v-model="draft.materials" />
    </section>

    <section class="admin-card">
      <DoorTypesTable v-model="draft.doorTypes" />
    </section>

    <section class="admin-card">
      <FinishesTable v-model="draft.finishes" />
    </section>

    <section class="admin-card">
      <HardwareFields v-model="draft.hardware" />
    </section>

    <section class="admin-card">
      <HingeTable v-model="draft.hardware.hinge.countByDoorHeight" />
    </section>

    <section class="admin-card">
      <LabourFields v-model="draft.labour" />
    </section>

    <section class="admin-card">
      <OverheadFields v-model="draft" />
    </section>

    <section class="admin-card">
      <LimitFields v-model="draft" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRaw } from 'vue';

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
 * Düzenleme bir TASLAK üstünde ve OTOMATİK KAYIT YOK: her kayıt yeni bir
 * sürüm yazıyor, tuş vuruşu başına yazsaydık yüzlerce sürüm olurdu. Yarım
 * kalan bir düzenleme de konfigüratörün gördüğü kataloğu bozmuyor.
 *
 * Karşılığında "kaydedilmemiş değişiklik var" göstermek zorunlu: kaydetmeden
 * ayrılan biri emeğini kaybeder ve bunu ancak geri döndüğünde anlar.
 */
const pricebookStore = usePricebookStore();
const { showErrorMessage, showSuccessMessage } = useFToast();

const draft = ref<IPriceBook>(structuredClone(DEFAULT_PRICE_BOOK));

/** Son yayınlanan (ya da yüklenen) hâl; kirlilik buna göre ölçülüyor. */
const saved = ref<string>(JSON.stringify(draft.value));

const isDirty = computed(() => JSON.stringify(draft.value) !== saved.value);

const apply = (book: IPriceBook) => {
  draft.value = structuredClone({
    ...toRaw(DEFAULT_PRICE_BOOK),
    ...toRaw(book),
    margin: toRaw(book).margin ?? DEFAULT_PRICE_BOOK.margin,
  });
  saved.value = JSON.stringify(draft.value);
};

const reset = () => apply(pricebookStore.book);

async function handlePublish() {
  try {
    await pricebookStore.publish(draft.value);
    apply(pricebookStore.book);
    showSuccessMessage(`Sürüm ${pricebookStore.book.version} yayınlandı.`);
  } catch (error) {
    showErrorMessage(error);
  }
}

onMounted(async () => {
  try {
    /*
     * `toRaw` şart: store'daki kitap Vue reaktif PROXY'si ve `structuredClone`
     * proxy'yi klonlayamıyor — hata sessizce taslağı tohumda bırakıyordu ve
     * ekran "Aktif sürüm: 0" gösteriyordu.
     */
    apply(await pricebookStore.fetch());
  } catch (error) {
    showErrorMessage(error);
  }
});
</script>

<style scoped>
/*
 * Kart kabuğu tek yerde: sekiz bölümün her birine aynı sınıf dizisini
 * kopyalamak, birini değiştirince diğerlerini geride bırakırdı.
 */
.admin-card {
  @apply border border-f-rule bg-f-paper p-5 md:p-7;
}
</style>
