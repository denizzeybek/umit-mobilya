import { randomInt } from 'node:crypto';

/**
 * Teklif referansı: insan için okunur bir önek, güvenlik için rastgele bir
 * son ek.
 *
 *   UM-2608-K7M4XQ
 *      │     └─ 6 karakter, crypto'dan
 *      └─────── yıl-ay
 *
 * Sıralı bir sayaç olamazdı: `GET /api/quotes/:code` public ve kod fiilen
 * teklifi açan anahtar. Sıralı olsaydı bir kodu gören herkes komşularını da
 * okuyabilirdi — ve teklifte müşterinin adı ve telefonu var.
 *
 * Önek ayrıca sıra bilgisi VERMEZ: rakip "bu ay kaç teklif verilmiş"
 * sayamıyor.
 */

/** Karışan karakterler yok: 0/O, 1/I/L telefonda okunurken hata üretiyor. */
export const QUOTE_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

const SUFFIX_LENGTH = 6;

export const generateQuoteCode = (now: Date): string => {
  const year = String(now.getUTCFullYear()).slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');

  let suffix = '';
  for (let index = 0; index < SUFFIX_LENGTH; index += 1) {
    suffix += QUOTE_CODE_ALPHABET[randomInt(QUOTE_CODE_ALPHABET.length)];
  }

  return `UM-${year}${month}-${suffix}`;
};
