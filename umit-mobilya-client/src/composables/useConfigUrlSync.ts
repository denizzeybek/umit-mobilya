import { onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  CONFIG_QUERY_KEY,
  encodeConfig,
} from '@/views/configurator/_etc/configUrl';

import type { EProductType, IBaseConfig } from '@/views/configurator/_etc/types';
import type { Ref } from 'vue';

/**
 * Tasarım ile adres çubuğunu iki yönlü eşitler.
 *
 * Tek yönlü olduğu sürece iki şey çalışmıyordu: koddaki `?c=` elle silinip
 * enter'landığında tasarım varsayılana dönmüyordu (bileşen yeniden kurulmadığı
 * için config olduğu yerde kalıyor, sonra yazma yönü kodu adrese geri
 * koyuyordu), ve başka bir tasarımın kodu yapıştırıldığında da hiçbir şey
 * olmuyordu.
 *
 * Konfigüratörün içinde değil `composables/` altında, çünkü burada Three.js
 * ya da ürün tanımı yok — yalnızca adres çubuğu ve config. Tembel paket sınırı
 * da bu yüzden bozulmuyor (Rule 10).
 */
export interface IConfigUrlSync {
  /** Eşitlenecek tasarım. */
  config: Ref<IBaseConfig>;
  /** Kodun içine yazılan ürün kimliği. */
  productType: () => EProductType;
  /** Kod yokken ya da okunamazken dönülecek tasarım. */
  createDefault: () => IBaseConfig;
  /** Adresteki kodu bu ürünün sınırlarına oturtarak çözer. */
  decode: () => IBaseConfig | null;
}

/**
 * `replace` ve 300 ms gecikme birlikte: kaydırıcı sürüklenirken her karede
 * geçmişe yazmak hem tarayıcıyı zorlar hem geri düğmesini kırk adım geri
 * götürürdü.
 */
const WRITE_DELAY_MS = 300;

export const useConfigUrlSync = (input: IConfigUrlSync): void => {
  const route = useRoute();
  const router = useRouter();

  let timer: ReturnType<typeof setTimeout> | undefined;
  /** Adrese en son YAZDIĞIMIZ kod — kendi yazdığımızı geri okumamak için. */
  let lastWritten = '';

  const isDefault = () =>
    JSON.stringify(input.config.value) === JSON.stringify(input.createDefault());

  const write = () => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      const { [CONFIG_QUERY_KEY]: _previous, ...rest } = route.query;

      /* Varsayılan tasarım adresi kirletmesin: sıfırlanınca kod da silinir. */
      lastWritten = isDefault()
        ? ''
        : encodeConfig(input.productType(), input.config.value);

      router.replace({
        query: lastWritten ? { ...rest, [CONFIG_QUERY_KEY]: lastWritten } : rest,
      });
    }, WRITE_DELAY_MS);
  };

  watch(input.config, write, { deep: true });

  watch(
    () => route.query[CONFIG_QUERY_KEY],
    (raw) => {
      const code = typeof raw === 'string' ? raw : '';
      if (code === lastWritten) return;

      clearTimeout(timer);
      lastWritten = code;
      input.config.value = input.decode() ?? input.createDefault();
    },
  );

  onBeforeUnmount(() => clearTimeout(timer));
};
