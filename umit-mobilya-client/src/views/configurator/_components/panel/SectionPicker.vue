<template>
  <!--
    Panelin DOĞRUDAN çocuğu olmak zorunda: `position: sticky` yalnızca kendi
    ebeveyninin kutusu içinde yapışıyor. Bu satır "4 — Bölüm seç" bölümünün
    içinde dururken, o bölüm ekrandan çıkar çıkmaz seçici de gidiyordu — yani
    tam olarak ihtiyaç duyulan anda, aşağıdaki kapak/düzen alanları
    okunurken.
  -->
  <div
    v-if="config.sectionCount > 1"
    class="sticky top-[72px] z-20 flex flex-wrap items-center gap-2 border-b border-f-rule bg-f-paper/95 px-6 py-3 backdrop-blur-sm md:top-[88px] md:px-7"
    data-testid="section-picker"
  >
    <span class="eyebrow shrink-0">Düzenlenen</span>

    <Button
      v-for="(_, index) in config.sectionCount"
      :key="index"
      size="small"
      :severity="active === index ? 'primary' : 'secondary'"
      :variant="active === index ? undefined : 'outlined'"
      class="!rounded-none"
      :aria-pressed="active === index"
      @click="active = index"
    >
      {{ sectionLabel(config.sectionCount, index) }}
      <span class="opacity-60">· {{ config.sections[index]?.width }} cm</span>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { sectionLabel } from '../../_etc/sectionLabel';

import type { IBaseConfig } from '../../_etc/types';

/**
 * Hangi bölümün düzenlendiğini gösteren yapışkan şerit.
 *
 * Aşağıdaki üç alan da (kapak kanadı, hazır düzen, özel düzen) SEÇİLİ bölüme
 * uygulanıyor ama seçim yukarıda kalıyordu: kullanıcı aşağı kaydırdıkça hangi
 * bölümde olduğunu unutup yanlış bölümü düzenliyordu.
 *
 * Tek bölümde gösterilmiyor — seçilecek bir şey yokken yer kaplayan bir şerit,
 * yalnızca gürültü.
 */
const config = defineModel<IBaseConfig>({ required: true });
const active = defineModel<number>('active', { required: true });
</script>
