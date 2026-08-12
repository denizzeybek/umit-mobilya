/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuoteContactResponseDto } from './QuoteContactResponseDto';
import type { QuotePriceDto } from './QuotePriceDto';
export type QuoteResponseDto = {
    /**
     * Konfigüratörün ürettiği tasarım, olduğu gibi.
     */
    config: Record<string, any>;
    /**
     * Müşteriye verilen referans, örn. `UM-2608-K7M4XQ`.
     */
    code: string;
    productType: string;
    /**
     * Tasarımın şema sürümü.
     */
    configSchemaVersion: number;
    /**
     * Teklif verildiği andaki fiyat — sonradan DEĞİŞMEZ.
     */
    price: QuotePriceDto;
    /**
     * Hangi fiyat kitabı sürümüyle hesaplandığı.
     */
    priceBookVersion: number;
    contact: QuoteContactResponseDto;
    createdAt: string;
};

