<template>
  <section v-if="config.doorType !== 'yok'" class="p-6 md:p-7">
    <div class="flex items-baseline justify-between gap-4">
      <h2 class="font-serif text-2xl text-f-ink">Kapak kanadı</h2>
      <span class="text-sm text-f-ink-faint">{{ label }}</span>
    </div>

    <p class="mt-2 text-sm text-f-ink-muted">
      Seçili bölümün kapağı kaç kanada bölünsün. Otomatikte
      {{ maxLeafWidth }} cm'yi geçen modül kendiliğinden bölünür.
    </p>

    <SelectButton
      v-model="choice"
      :options="OPTIONS"
      option-label="label"
      option-value="value"
      :allow-empty="false"
      class="mt-4"
    />

    <p class="mt-3 text-sm text-f-ink-faint">
      {{ leaves }} kanat &middot; her biri {{ leafWidth }} cm
      <span v-if="tooWide" class="text-f-danger">
        — {{ maxLeafWidth }} cm tavanının üstünde
      </span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { PANEL_THICKNESS_CM } from '../../_etc/geometry/units';
import {
  doorLeafCount,
  MAX_DOOR_LEAVES,
} from '../../_etc/pricing/moduleLayout';
import { sectionLabel } from '../../_etc/sectionLabel';

import type { IProductLimits } from '../../_etc/types';
import type { IBaseConfig } from '../../_etc/types';

/**
 * Kanat sayısı türetilmiş bir değerdi; artık bölümün kendi kararı olabiliyor.
 *
 * Elle seçim tavanı EZİYOR ve bu bilinçli: tavan bir varsayım, atölyeyi tanıyan
 * taraf kullanıcı. Ama sonucu gizlemiyoruz — kanat genişliği hep yazılı, tavanı
 * aşan seçim uyarı alıyor. Engellemek yerine göstermek.
 */
interface IProps {
  active: number;
  limits: IProductLimits;
}

const props = defineProps<IProps>();

const config = defineModel<IBaseConfig>({ required: true });

const OPTIONS = [
  { label: 'Otomatik', value: 0 },
  ...Array.from({ length: MAX_DOOR_LEAVES }, (_, index) => ({
    label: String(index + 1),
    value: index + 1,
  })),
];

const section = computed(() => config.value.sections[props.active]);

const label = computed(() =>
  sectionLabel(config.value.sectionCount, props.active),
);

const maxLeafWidth = computed(() => props.limits.maxDoorLeafWidthCm);

/** Modülün DIŞ genişliği: bölüm genişliği artı kendi iki yan paneli. */
const outerWidth = computed(
  () => (section.value?.width ?? 0) + 2 * PANEL_THICKNESS_CM,
);

const choice = computed({
  get: () => section.value?.doorLeaves ?? 0,
  set: (value: number) => {
    const target = config.value.sections[props.active];
    if (target) target.doorLeaves = value === 0 ? null : value;
  },
});

const leaves = computed(() =>
  doorLeafCount(
    outerWidth.value,
    maxLeafWidth.value,
    section.value?.doorLeaves,
  ),
);

const leafWidth = computed(() =>
  leaves.value > 0
    ? Math.round((outerWidth.value / leaves.value) * 10) / 10
    : 0,
);

const tooWide = computed(() => leafWidth.value > maxLeafWidth.value);
</script>
