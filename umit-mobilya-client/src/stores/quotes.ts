import { defineStore } from 'pinia';

import { QuotesService } from '@/client';
import { EStoreNames } from '@/stores/storeNames.enum';

import type {
  CreateQuoteDto,
  QuoteListDto,
  QuoteResponseDto,
} from '@/client';

interface State {
  list: QuoteListDto | null;
  current: QuoteResponseDto | null;
  loading: boolean;
  saving: boolean;
}

/**
 * Teklif talepleri. Gövde yalnızca `productType`, `config` ve `contact`
 * taşır — fiyat GÖNDERİLMEZ, sunucu kendi hesaplar. Sunucu zaten
 * `forbidNonWhitelisted` ile reddediyor; buradan göndermemek onun ikinci
 * teyidi ve niyetin okunur hali.
 */
export const useQuotesStore = defineStore(EStoreNames.QUOTES, {
  state: (): State => ({
    list: null,
    current: null,
    loading: false,
    saving: false,
  }),
  actions: {
    async create(payload: CreateQuoteDto): Promise<QuoteResponseDto> {
      this.saving = true;
      try {
        this.current = await QuotesService.quoteControllerCreate(payload);
        return this.current;
      } finally {
        this.saving = false;
      }
    },

    async fetchByCode(code: string): Promise<QuoteResponseDto> {
      this.loading = true;
      try {
        this.current = await QuotesService.quoteControllerByCode(code);
        return this.current;
      } finally {
        this.loading = false;
      }
    },

    async fetchList(limit = 20, skip = 0): Promise<QuoteListDto> {
      this.loading = true;
      try {
        this.list = await QuotesService.quoteControllerList(
          String(limit),
          String(skip),
        );
        return this.list;
      } finally {
        this.loading = false;
      }
    },

    async remove(code: string): Promise<void> {
      this.saving = true;
      try {
        await QuotesService.quoteControllerRemove(code);
      } finally {
        this.saving = false;
      }
    },
  },
});
