<template>
  <PresetPicker v-model="config" :active="active" />
  <SectionLayoutFields v-model="config" :active="active" />
</template>

<script setup lang="ts">
import PresetPicker from './PresetPicker.vue';
import SectionLayoutFields from './SectionLayoutFields.vue';

import type { IGardiropConfig } from '../../../_etc/products/gardirop/types';

/**
 * Gardıroba özel panel bölümleri. `IProductDefinition.fields` bunu işaret
 * ediyor; vestiyer ve mutfak kendi karşılıklarını yazacak ve panel kabuğu
 * hiçbirini tanımayacak.
 */
interface IProps {
  active: number;
}

defineProps<IProps>();

const config = defineModel<IGardiropConfig>({ required: true });
</script>
