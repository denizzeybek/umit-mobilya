import type { QuoteResponseDto } from '../../src/quote/dto/quote-response.dto';

/**
 * Golden'a giren hâli.
 *
 * Yanıttan ÇIKARILANLAR ve nedenleri:
 *
 * | Alan        | Neden |
 * |-------------|-------|
 * | `code`      | `generateQuoteCode` crypto'dan üretiyor; kayıt başına değişir |
 * | `createdAt` | duvar saati |
 * | `contact`   | teklifin konusu değil, talebi edenin bilgisi |
 *
 * KALAN her şey golden'ın konusudur — `config` dahil, çünkü golden'ı okuyan
 * kişi hangi tasarımın kaç lira ettiğini tek dosyada görebilmeli.
 *
 * `displayTotal` hesaplanıp EKLENİYOR: `PriceSummary.vue` toplamı onluğa
 * çekerek gösteriyor, yani müşterinin gördüğü rakam bu. Kayan şey oydu, o
 * yüzden golden'da açıkça duruyor — ham `total`in yanında, ikisi birden.
 */
export interface INormalizedQuote {
  productType: string;
  configSchemaVersion: number;
  priceBookVersion: number;
  config: Record<string, unknown>;
  price: QuoteResponseDto['price'];
  /** Ekranda görünen tutar: `Math.round(total / 10) * 10`. */
  displayTotal: number;
}

/** `PriceSummary.vue` ile aynı yuvarlama. İkisi ayrışırsa golden söyler. */
export const displayTotalOf = (total: number): number =>
  Math.round(total / 10) * 10;

export const normalizeQuote = (
  quote: QuoteResponseDto,
): INormalizedQuote => ({
  productType: quote.productType,
  configSchemaVersion: quote.configSchemaVersion,
  priceBookVersion: quote.priceBookVersion,
  config: quote.config,
  price: quote.price,
  displayTotal: displayTotalOf(quote.price.total),
});
