<template>
  <section class="p-6 md:p-7">
    <p class="eyebrow">Tasarımını sakla</p>

    <Button
      :label="copied ? 'Bağlantı kopyalandı' : 'Tasarımın bağlantısını kopyala'"
      :icon="copied ? 'pi pi-check' : 'pi pi-link'"
      severity="secondary"
      outlined
      class="mt-4 w-full"
      @click="handleCopy"
    />

    <p class="mt-3 text-sm text-f-ink-muted">
      Bağlantı ölçülerini ve seçimlerini taşır — açan kişi tam olarak bu
      tasarımı görür.
    </p>

    <Button
      label="Tasarımı sıfırla"
      icon="pi pi-refresh"
      severity="secondary"
      text
      class="mt-4"
      data-testid="reset-design"
      @click="emit('reset')"
    />

    <p class="mt-1 text-sm text-f-ink-faint">
      Ölçüler, modüller ve iç düzen başlangıç hâline döner; adresteki tasarım
      kodu da silinir.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import { useFToast } from '@/composables/useFToast';

import { CONFIG_QUERY_KEY, encodeConfig } from '../../_etc/configUrl';

import type { IBaseConfig, IProductDefinition } from '../../_etc/types';

/**
 * Bağlantı adres çubuğundan okunmuyor, config'den ÜRETİLİYOR: adrese yazma
 * 300 ms gecikmeli ve kullanıcı son kaydırıcıyı bırakır bırakmaz kopyalarsa
 * bir önceki tasarımı paylaşmış olurdu.
 */
interface IProps {
  definition: IProductDefinition;
  config: IBaseConfig;
}

interface IEmits {
  /** Tasarımı varsayılana döndür — sıfırlamayı config'in sahibi yapar. */
  reset: [];
}

const props = defineProps<IProps>();
const emit = defineEmits<IEmits>();

const { showErrorMessage } = useFToast();

const copied = ref(false);

let resetTimer: ReturnType<typeof setTimeout> | undefined;

const shareUrl = computed(() => {
  const url = new URL(window.location.href);
  url.searchParams.set(
    CONFIG_QUERY_KEY,
    encodeConfig(props.definition.id, props.config),
  );

  return url.toString();
});

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    copied.value = true;

    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      copied.value = false;
    }, 2500);
  } catch (error) {
    /*
     * Pano yalnızca güvenli bağlamda (https ya da localhost) çalışıyor. Sessiz
     * kalmak, düğmeye basıp hiçbir şey olmadığını görmekten kötü.
     */
    showErrorMessage(error);
  }
}

onBeforeUnmount(() => clearTimeout(resetTimer));
</script>
