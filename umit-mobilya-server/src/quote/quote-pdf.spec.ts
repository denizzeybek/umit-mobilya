import { join } from 'node:path';

import { readFileSync } from 'node:fs';

import { quoteDocumentModel } from './quote-document';
import { FONT_DIR, renderQuotePdf } from './quote-pdf';

import type { QuoteResponseDto } from './dto/quote-response.dto';

/**
 * TTF `cmap` tablosundaki format 4 alt tablosunu okur — Latin ve Latin
 * genişletilmiş karakterler orada yaşıyor. Tam bir font ayrıştırıcısı değil;
 * yalnızca "bu kod noktasının glifi var mı" sorusunu cevaplıyor.
 */
const cmapCodePoints = (bytes: Buffer): Set<number> => {
  const numTables = bytes.readUInt16BE(4);
  let cmapOffset = 0;

  for (let index = 0; index < numTables; index += 1) {
    const record = 12 + index * 16;
    if (bytes.toString('latin1', record, record + 4) === 'cmap') {
      cmapOffset = bytes.readUInt32BE(record + 8);
    }
  }

  const found = new Set<number>();
  const subtables = bytes.readUInt16BE(cmapOffset + 2);

  for (let index = 0; index < subtables; index += 1) {
    const entry = cmapOffset + 4 + index * 8;
    const table = cmapOffset + bytes.readUInt32BE(entry + 4);
    if (bytes.readUInt16BE(table) !== 4) continue;

    const segCount = bytes.readUInt16BE(table + 6) / 2;
    const endBase = table + 14;
    const startBase = endBase + segCount * 2 + 2;

    for (let seg = 0; seg < segCount; seg += 1) {
      const end = bytes.readUInt16BE(endBase + seg * 2);
      const start = bytes.readUInt16BE(startBase + seg * 2);
      for (let code = start; code <= end && code !== 0xffff; code += 1) {
        found.add(code);
      }
    }
  }

  return found;
};

const quote = {
  code: 'UM-2608-K7M4XQ',
  productType: 'gardirop',
  configSchemaVersion: 1,
  config: { width: 180, height: 220, depth: 60 },
  price: {
    lines: [{ label: 'Gövde — Meşe', amount: 14880 }],
    netTotal: 40000,
    vat: 8000,
    total: 48000,
  },
  priceBookVersion: 1,
  contact: { name: 'Şükrü Çağrı Ünlü', phone: '0549 676 21 08' },
  createdAt: new Date('2026-08-12T09:00:00Z'),
} as unknown as QuoteResponseDto;

/**
 * Türkçe karakterler pdfmake'in standart fontlarında (WinAnsi) YOK. Gömülü
 * TTF kullanılmazsa `ğ ş ı İ` sessizce kayboluyor ve bunu ancak müşteri fark
 * ediyor — bu spec o sessizliği engelliyor.
 */
describe('renderQuotePdf', () => {
  it('geçerli bir PDF üretir', async () => {
    const buffer = await renderQuotePdf(quoteDocumentModel(quote));

    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(1000);
  });

  /*
   * Asıl önkoşul: gömülen font Türkçe glifleri TAŞIMALI. pdfmake'in standart
   * 14 fontu (WinAnsi) taşımıyor ve belge sessizce `Sukru Cagri` diye
   * çıkardı — bunu ancak müşteri fark ederdi.
   *
   * PDF akışını ayrıştırmak yerine fontun kendisi denetleniyor: kırılgan
   * olmayan ve gerçekten koşulu ifade eden kontrol bu.
   */
  it('gömülen font Türkçe glifleri taşır', () => {
    const eksik: string[] = [];

    for (const file of ['Roboto-Regular.ttf', 'Roboto-Medium.ttf']) {
      const bytes = readFileSync(join(FONT_DIR, file));
      const mapped = cmapCodePoints(bytes);

      for (const char of ['ğ', 'ş', 'ı', 'İ', 'ö', 'ç', 'Ü']) {
        if (!mapped.has(char.codePointAt(0) as number)) {
          eksik.push(`${file}: ${char}`);
        }
      }
    }

    expect(eksik).toEqual([]);
  });
});
