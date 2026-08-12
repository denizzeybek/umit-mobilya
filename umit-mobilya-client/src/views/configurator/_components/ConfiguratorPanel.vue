<template>
  <div class="flex flex-col divide-y divide-f-rule border border-f-rule bg-f-paper">
    <MaterialFields v-model="config" />
    <DimensionFields v-model="config" :limits="definition.limits" />
    <CarcassFields v-model="config" />
    <SectionCountFields
      v-model="config"
      v-model:active="active"
      :limits="definition.limits"
      :create-section="definition.createSection"
    />

    <!--
      Ürüne özel bölümler. Panel kabuğu hangi ürünü gösterdiğini bilmiyor;
      tanım hangi bileşeni çizeceğini kendisi söylüyor.
    -->
    <component :is="definition.fields" v-model="config" :active="active" />

    <PriceSummary :price="price" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import CarcassFields from './panel/CarcassFields.vue';
import DimensionFields from './panel/DimensionFields.vue';
import MaterialFields from './panel/MaterialFields.vue';
import PriceSummary from './panel/PriceSummary.vue';
import SectionCountFields from './panel/SectionCountFields.vue';

import type { IBaseConfig, IProductDefinition } from '../_etc/types';

interface IProps {
  definition: IProductDefinition;
}

const props = defineProps<IProps>();

const config = defineModel<IBaseConfig>({ required: true });

/**
 * Hangi bölümün düzenlendiği panelin kendi durumu, config'in değil: kaydedilen
 * tasarımın parçası değil, sadece bir seçim.
 */
const active = ref(0);

const price = computed(() => props.definition.price(config.value));

watch(
  () => config.value.sectionCount,
  (count) => {
    if (active.value > count - 1) active.value = count - 1;
  },
);
</script>
