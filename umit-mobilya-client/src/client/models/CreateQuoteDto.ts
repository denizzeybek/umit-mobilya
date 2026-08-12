/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuoteContactDto } from './QuoteContactDto';
export type CreateQuoteDto = {
    /**
     * Hangi ürün tipi için teklif isteniyor — `gardirop`, `vestiyer`.
     */
    productType: string;
    /**
     * Konfigüratörün ürettiği tasarım. Fiyat BURADA KABUL EDİLMEZ: tutar
     * sunucuda yeniden hesaplanır, yoksa admin panelindeki her sayı
     * istemcinin iddiası olurdu.
     */
    config: Record<string, any>;
    /**
     * İletişim bilgileri.
     */
    contact: QuoteContactDto;
};

