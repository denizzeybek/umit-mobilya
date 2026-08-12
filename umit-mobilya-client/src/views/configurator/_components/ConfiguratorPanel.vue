<template>
  <div class="flex flex-col divide-y divide-f-rule border border-f-rule bg-f-paper">
    <MaterialFields v-model="config" :book="book" />
    <DimensionFields v-model="config" :limits="definition.limits" />
    <CarcassFields v-model="config" :book="book" />
    <SectionCountFields
      v-model="config"
      v-model:active="active"
      :limits="definition.limits"
      :create-section="definition.createSection"
    />

    <DoorLeafFields
      v-model="config"
      :active="active"
      :limits="definition.limits"
    />

    <!--
      Ürüne özel bölümler. Panel kabuğu hangi ürünü gösterdiğini bilmiyor;
      tanım hangi bileşeni çizeceğini kendisi söylüyor.
    -->
    <component :is="definition.fields" v-model="config" :active="active" />

    <PriceSummary :price="price" @download-quote="showQuote = true" />

    <QuoteDialog
      v-if="showQuote"
      v-model:open="showQuote"
      :config="config"
      :product-type="definition.id"
    />

    <ShareLink :config="config" :definition="definition" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { priceOf } from '../_etc/pricing/priceOf';

import CarcassFields from './panel/CarcassFields.vue';
import DimensionFields from './panel/DimensionFields.vue';
import DoorLeafFields from './panel/DoorLeafFields.vue';
import MaterialFields from './panel/MaterialFields.vue';
import PriceSummary from './panel/PriceSummary.vue';
import SectionCountFields from './panel/SectionCountFields.vue';
import ShareLink from './panel/ShareLink.vue';
import QuoteDialog from './QuoteDialog.vue';

import type { IPriceBook } from '../_etc/pricing/priceBook';
import type { IPart } from '../_etc/pricing/types';
import type { IBaseConfig, IProductDefinition } from '../_etc/types';

interface IProps {
  definition: IProductDefinition;
  /** Sahneyi çizen listenin AYNISI — fiyat da ondan çıkıyor. */
  parts: IPart[];
  /** Aktif fiyat kitabı; katalog ve fiyatlar buradan. */
  book: IPriceBook;
}

const props = defineProps<IProps>();

const config = defineModel<IBaseConfig>({ required: true });

/**
 * Hangi bölümün düzenlendiği panelin kendi durumu, config'in değil: kaydedilen
 * tasarımın parçası değil, sadece bir seçim.
 */
const active = ref(0);

const price = computed(() =>
  priceOf(props.parts, props.book, {
    material: config.value.material,
    finish: config.value.finish,
    doorType: config.value.doorType,
    backPanel: config.value.backPanel,
  }),
);

const showQuote = ref(false);

watch(
  () => config.value.sectionCount,
  (count) => {
    if (active.value > count - 1) active.value = count - 1;
  },
);
</script>
