import { defineStore } from 'pinia';

import { PricebookService } from '@/client';
import { EStoreNames } from '@/stores/storeNames.enum';
import { DEFAULT_PRICE_BOOK } from '@/views/configurator/_etc/pricing/defaults';

import type { IPriceBook } from '@/views/configurator/_etc/pricing/priceBook';

interface State {
  book: IPriceBook;
  loaded: boolean;
  loading: boolean;
  saving: boolean;
}

/**
 * Fiyat kitabı. Başlangıç değeri tohum kitap: site API olmadan da ayakta
 * kalmalı ve konfigüratör, katalog isteği düşse bile açılmalı. `fetch`
 * başarısız olursa tohum yerinde kalıyor — bilinçli, çünkü boş bir katalog
 * konfigüratörü kullanılamaz yapardı.
 *
 * Public cevap kâr marjını taşımıyor; admin ekranı `fetchAdmin` ile
 * sürümlere ulaşıyor.
 */
export const usePricebookStore = defineStore(EStoreNames.PRICEBOOK, {
  state: (): State => ({
    book: DEFAULT_PRICE_BOOK,
    loaded: false,
    loading: false,
    saving: false,
  }),
  actions: {
    async fetch(): Promise<IPriceBook> {
      this.loading = true;
      try {
        const response = await PricebookService.priceBookControllerActive();
        this.book = {
          ...DEFAULT_PRICE_BOOK,
          ...(response.data as unknown as IPriceBook),
          version: response.version,
        };
        this.loaded = true;
        return this.book;
      } finally {
        this.loading = false;
      }
    },

    async publish(book: IPriceBook): Promise<IPriceBook> {
      this.saving = true;
      try {
        const response = await PricebookService.priceBookControllerPublish({
          data: book as unknown as Record<string, unknown>,
        });
        this.book = {
          ...(response.data as unknown as IPriceBook),
          version: response.version,
        };
        return this.book;
      } finally {
        this.saving = false;
      }
    },
  },
});
