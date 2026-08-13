<template>
  <!--
    Tek satır, sabit yükseklik. Önceki hâlde desen yüklenince hücreye ikinci
    bir satır (ölçek alanı) giriyordu: o satır büyüyor, tablodaki bütün
    hizalama kayıyordu. Ölçek artık kendi sütununda.
  -->
  <div class="flex items-center gap-2">
    <span
      class="h-9 w-9 shrink-0 rounded border border-f-rule bg-cover bg-center"
      :style="previewStyle"
      :title="finish.textureUrl ? 'Yüklü desen' : 'Desen yok, düz renk'"
    />

    <FileUpload
      mode="basic"
      accept="image/*"
      custom-upload
      auto
      :choose-label="finish.textureName ? 'Değiştir' : 'Yükle'"
      :choose-icon="finish.textureName ? 'pi pi-refresh' : 'pi pi-upload'"
      :choose-button-props="CHOOSE_BUTTON"
      :disabled="pricebookStore.uploading"
      @uploader="handleUpload"
    />

    <Button
      v-if="finish.textureName"
      icon="pi pi-times"
      severity="secondary"
      text
      size="small"
      aria-label="Deseni kaldır"
      @click="handleClear"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useFToast } from '@/composables/useFToast';
import { usePricebookStore } from '@/stores/pricebook';
import { DEFAULT_TEXTURE_SCALE_CM } from '@/views/configurator/_etc/pricing/priceBook';

import type { IFinish } from '@/views/configurator/_etc/pricing/priceBook';
import type { FileUploadUploaderEvent } from 'primevue/fileupload';

/**
 * Bir kaplamanın desen görseli.
 *
 * Yükleme YAYINLAMADAN ayrı: görsel kovaya hemen gidiyor, anahtarın kitaba
 * girmesi adminin "Yeni sürüm yayınla" kararına kalıyor. Birleşik olsaydı tek
 * bir desen denemesi bütün fiyat kitabını yeni bir sürüme iterdi.
 */
interface IProps {
  finish: IFinish;
}

const props = defineProps<IProps>();

const emit = defineEmits<IEmits>();

interface IEmits {
  /**
   * Değişen kaplamanın TAMAMI. Prop'u yerinde değiştirmek yerine yenisini
   * yukarı vermek bilinçli: satır listenin malı, hücrenin değil — ve eslint
   * `vue/no-mutating-props` ile bunu zaten zorluyor.
   */
  (event: 'update', finish: IFinish): void;
}

const pricebookStore = usePricebookStore();
const { showErrorMessage } = useFToast();

/*
 * Sessiz düğme: dolu koyu bir düğme tablodaki her satırda göze ilk çarpan şey
 * oluyordu — oysa buradaki asıl bilgi kaplamanın kendisi, yükleme ikincil bir
 * eylem.
 */
const CHOOSE_BUTTON = {
  severity: 'secondary' as const,
  outlined: true,
  size: 'small' as const,
};

const previewStyle = computed(() =>
  props.finish.textureUrl
    ? { backgroundImage: `url(${props.finish.textureUrl})` }
    : { backgroundColor: props.finish.swatch },
);

const handleUpload = async (event: FileUploadUploaderEvent): Promise<void> => {
  const file = Array.isArray(event.files) ? event.files[0] : event.files;
  if (!file) return;

  try {
    const saved = await pricebookStore.uploadTexture(file);

    emit('update', {
      ...props.finish,
      textureName: saved.textureName,
      /*
       * URL yalnızca önizleme için taşınıyor; sunucu yayınlarken söküyor,
       * yoksa kitapta kalıcı bir URL birikirdi (Rule 10).
       */
      textureUrl: saved.textureUrl,
      textureScaleCm: props.finish.textureScaleCm ?? DEFAULT_TEXTURE_SCALE_CM,
    });
  } catch (error) {
    showErrorMessage(error);
  }
};

/*
 * Kovadaki nesne SİLİNMİYOR, yalnızca kaplamadan çözülüyor: aynı anahtar
 * yayınlanmış eski sürümlerde duruyor olabilir ve o sürümler geçmiş
 * tekliflerin neye benzediğinin kaydı.
 */
const handleClear = (): void => {
  const { textureName: _name, ...rest } = props.finish;
  emit('update', { ...rest, textureUrl: null });
};

</script>
