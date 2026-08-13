<template>
  <!--
    Panelin DOĞRUDAN çocuğu olmak zorunda: `position: sticky` yalnızca kendi
    ebeveyninin kutusu içinde yapışıyor. Bu satır "4 — Bölüm seç" bölümünün
    içinde dururken, o bölüm ekrandan çıkar çıkmaz seçici de gidiyordu — yani
    tam olarak ihtiyaç duyulan anda, aşağıdaki kapak/düzen alanları
    okunurken.

    Ofset başlığın GERÇEK yüksekliği: 73 / 89 px. Layout'un dolgu değerleri
    (72 / 88) bir piksel kısa — başlığın alt kenarlığını saymıyorlar — ve o
    fark şeridin üst kenarını başlığın altına sokuyordu.

    Arka plan tam opak, yarı saydam değil: altından kayan metin şeridin
    içinden hayal meyal görünüyordu ve bu, yapışkanlığı bozukmuş gibi
    gösteriyordu.
  -->
  <div
    v-if="config.sectionCount > 1"
    class="sticky top-[73px] z-20 flex flex-col gap-2 border-b border-f-rule bg-f-paper px-6 py-3 md:top-[89px] md:px-7"
    data-testid="section-picker"
  >
    <!--
      Etiket KENDİ satırında: düğmelerin yanındayken üçüncü modül alta
      kayıyor ve etiketin altından başlıyordu — ikinci satır ilkiyle
      hizalanmıyor, şerit kırık görünüyordu.
    -->
    <span class="eyebrow">Modül seç</span>

    <div class="flex flex-wrap gap-2">
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
        <!--
          Köşe rozeti burada, çünkü hangi modülün köşe olduğu düzenleme
          alanında değil bu şeritte aranıyor: kullanıcı modüller arasında
          gezerken tek tek açıp bakmak zorunda kalmasın.
        -->
        <span v-if="config.sections[index]?.corner" class="opacity-60">· köşe</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { sectionLabel } from '../../_etc/sectionLabel';

import type { IBaseConfig } from '../../_etc/types';

/**
 * Bölümün SEÇİLDİĞİ yer — ve adı bunu söylüyor.
 *
 * Önceki hâlde "4 — Bölüm seç" başlığı modül sayısının üstündeydi ve burası
 * "Düzenlenen" diyordu: kullanıcı bölümü seçtiğini sandığı yerde aslında
 * modül sayısını değiştiriyordu. Fiil artık gerçekten seçim yapılan yerde.
 *
 * Aşağıdaki üç alan da (kapak kanadı, hazır düzen, özel düzen) SEÇİLİ bölüme
 * uygulanıyor ama seçim yukarıda kalıyordu: kullanıcı aşağı kaydırdıkça hangi
 * bölümde olduğunu unutup yanlış bölümü düzenliyordu.
 *
 * Tek modülde gösterilmiyor — seçilecek bir şey yokken yer kaplayan bir şerit,
 * yalnızca gürültü.
 */
const config = defineModel<IBaseConfig>({ required: true });
const active = defineModel<number>('active', { required: true });
</script>
