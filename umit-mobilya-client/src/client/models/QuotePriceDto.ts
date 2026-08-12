/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuotePriceLineDto } from './QuotePriceLineDto';
export type QuotePriceDto = {
    /**
     * Müşteriye gösterilen kalemler. Gizli maliyetler (arkalık, kâr marjı)
     * burada YOKTUR ama toplama dahildir — bu yüzden satırların toplamı
     * `total` ile tutmaz.
     */
    lines: Array<QuotePriceLineDto>;
    /**
     * KDV öncesi tutar, marj dahil.
     */
    netTotal: number;
    /**
     * Hesaplanan KDV.
     */
    vat: number;
    /**
     * Ödenecek tutar.
     */
    total: number;
};

