import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { CLIENT, collect } from '../scripts/sync-pricing';
import { DEFAULT_PRICE_BOOK } from '../src/configurator/generated/pricing/defaults';

import { priceCases } from './price-net/cases';

/**
 * Bir ürün EKSİKSİZ eklendi mi?
 *
 * Konfigüratöre ürün eklemek on üç yere dokunuyor ve bunların yalnızca bir
 * kısmı derleyici tarafından korunuyor: `registry.ts` bir `Record<EProductType,
 * ...>` olduğu için eksik üye derleme hatası verir, ürün klasörünün kendisi de
 * import edilmediğinde ortaya çıkar.
 *
 * Korunmayanlar sessiz kırılıyor ve hepsi bu dosyanın konusu:
 *
 *   - `sync-pricing.js` listesine eklenmemiş bir `parts.ts` → sunucu ürünü
 *     hiç görmez, `POST /api/quotes` o ürün için patlar. `pricing-sync.spec.ts`
 *     bunu YAKALAMAZ: o yalnızca listede olanların kopyasını kıyaslıyor,
 *     listede olmayanı sormuyor.
 *   - fiyat kitabında ayar yokluğu → ölçü sınırları `undefined`.
 *   - fiyat ağında `<slug>-varsayilan` case yokluğu → o ürünün varsayılan
 *     tasarımının tutarı hiç çivilenmemiş olur (Rule 13 §7.7).
 *
 * Ürün listesi istemcinin KLASÖRLERİNDEN okunuyor, elle yazılmış bir listeden
 * değil: elle yazılan liste, tam olarak bu testin yakalamak istediği şeyle
 * birlikte güncellenmeyi unutulan şey olurdu.
 *
 * Adındaki `characterization`: var olan yapıyı çiviliyor, yeni davranış
 * getirmiyor — yani ilk koşumda yeşil olması beklenen doğru sonuç
 * (`enforce-spec-failing` bu adı bu yüzden muaf tutuyor).
 */
const PRODUCTS_DIR = join(CLIENT, 'products');

const SLUGS = readdirSync(PRODUCTS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

/** Taşınabilir çekirdeğe ait, ürün başına zorunlu dosyalar. */
const PORTABLE = ['types.ts', 'parts.ts', 'options.ts'];

describe('ürün eksiksizliği', () => {
  /*
   * `describe.each([])` HİÇBİR test bildirmez ve suite yeşil biter. Yani yol
   * yanlışsa bu dosyanın tamamı sessizce hiçbir şey kanıtlamaz — o boşluğu
   * kapatan tek iddia bu.
   */
  it('istemcide en az bir ürün klasörü bulundu', () => {
    expect(SLUGS.length).toBeGreaterThan(0);
  });

  describe.each(SLUGS)('%s', (slug) => {
    it('taşınabilir dosyaları sunucuya kopyalanıyor', async () => {
      const copied = (await collect()).map((file) => file.to);

      for (const name of PORTABLE) {
        expect(copied).toContain(join('products', slug, name));
      }
    });

    it('fiyat kitabında ürün ayarı var', () => {
      expect(DEFAULT_PRICE_BOOK.products[slug]).toBeDefined();
    });

    it('fiyat ağında varsayılan tasarım case i var', () => {
      const own = priceCases(DEFAULT_PRICE_BOOK).find(
        (item) => item.id === `${slug}-varsayilan`,
      );

      expect(own).toBeDefined();
      expect(own?.productType).toBe(slug);
    });

    it('varsayılan tasarımın golden dosyası var', () => {
      const golden = join(
        __dirname,
        'price-net',
        '__goldens__',
        `${slug}-varsayilan.json`,
      );

      expect(existsSync(golden)).toBe(true);
    });
  });
});
