import { describe, expect, it } from 'vitest';

import { buildFromParts } from './geometry/buildFromParts';
import { DEFAULT_PRICE_BOOK } from './pricing/defaults';
import { priceOf } from './pricing/priceOf';
import { gardiropDefinition } from './products/gardirop';
import { PRODUCTS } from './registry';

import type { IBaseConfig } from './types';

/**
 * Her ürünün varsayılan config'i, katalogda GERÇEKTEN var olan kimlikleri
 * taşımalı. Bu dosya var çünkü tam bu kayma yaşandı: gardırobun varsayılanı
 * `lak` yazıyordu, katalog `lak-panel`e döndü, `priceOf` haklı olarak hata
 * verdi ve panel sessizce hiç render olmadı — konsolda tek satır hata yoktu.
 *
 * Birim testlerinin hepsi yeşildi, çünkü her biri kendi kurduğu config'i
 * test ediyordu. Ürünün KENDİ varsayılanını kimse denemiyordu.
 */
const selectionOf = (config: IBaseConfig) => ({
  material: config.material,
  finish: config.finish,
  doorType: config.doorType,
  backPanel: config.backPanel,
});

const entries = Object.entries(PRODUCTS);

describe('ürün kayıt defteri', () => {
  it.each(entries)('%s varsayılanı katalogda var olan kimlikler taşır', (_, definition) => {
    const config = definition.createDefault();
    const ids = DEFAULT_PRICE_BOOK;

    expect(ids.materials.some((m) => m.id === config.material)).toBe(true);
    expect(ids.finishes.some((f) => f.id === config.finish)).toBe(true);
    expect(ids.doorTypes.some((d) => d.id === config.doorType)).toBe(true);
    expect(ids.backPanels.some((b) => b.id === config.backPanel)).toBe(true);
  });

  it.each(entries)('%s varsayılanı fiyatlanabilir', (_, definition) => {
    const config = definition.createDefault();
    const parts = definition.parts(config, DEFAULT_PRICE_BOOK);

    const price = priceOf(parts, DEFAULT_PRICE_BOOK, selectionOf(config));

    expect(price.total).toBeGreaterThan(0);
    expect(price.lines.length).toBeGreaterThan(0);
  });

  it.each(entries)('%s varsayılanı sahneye çevrilebilir', (_, definition) => {
    const config = definition.createDefault();
    const build = buildFromParts({
      config,
      parts: definition.parts(config, DEFAULT_PRICE_BOOK),
      book: DEFAULT_PRICE_BOOK,
    });

    expect(build.group.children.length).toBeGreaterThan(0);
    build.dispose();
  });

  /*
   * Çekmece fiyat açısından TEK kalem (birim fiyatı rayı ve malzemeyi
   * içeriyor) ama sahnede beş çekmece beş ön panel demek. Bir kez tek parçaya
   * çökertilmişti ve sahne yığının ortasında havada duran tek bir panel
   * çiziyordu — fiyat doğruydu, görüntü yanlıştı.
   */
  it('her çekmece ayrı parça olur ama fiyat adet üstünden kalır', () => {
    const base = gardiropDefinition.createDefault();
    const config = {
      ...base,
      sections: base.sections.map((section, index) => ({
        ...section,
        drawers: index === 0 ? 4 : 0,
      })),
    };

    const parts = gardiropDefinition.parts(config, DEFAULT_PRICE_BOOK);
    const drawers = parts.filter((part) => part.kind === 'cekmece');

    expect(drawers).toHaveLength(4);
    expect(drawers.every((part) => part.qty === 1)).toBe(true);

    /* Dördü de farklı yükseklikte: üst üste yığılıyorlar. */
    const heights = drawers.map((part) => part.placement?.y);
    expect(new Set(heights).size).toBe(4);

    const price = priceOf(parts, DEFAULT_PRICE_BOOK, selectionOf(config));
    const line = price.lines.find((item) => item.label === 'Çekmeceler');

    expect(line?.amount).toBe(
      4 * DEFAULT_PRICE_BOOK.hardware.drawer.pricePerUnit,
    );
  });

  /*
   * Fiyat kitabı API'den JSON olarak geçiyor. `Infinity` ve `NaN` JSON'da
   * `null`a dönüşüyor — menteşe tablosunun son kademesi bir kez böyle
   * bozuldu ve sıralamayı kırdı. Tohum kitap JSON turundan AYNEN çıkmalı.
   */
  it('tohum fiyat kitabı JSON turundan bozulmadan çıkar', () => {
    const roundTripped = JSON.parse(JSON.stringify(DEFAULT_PRICE_BOOK));

    expect(roundTripped).toEqual(DEFAULT_PRICE_BOOK);
  });

  /*
   * Kataloğun her seçeneği her üründe fiyatlanabilmeli: gizli olanlar dahil,
   * çünkü eski bir config ya da paylaşılmış bir bağlantı onları taşıyabilir.
   */
  it.each(entries)('%s katalogdaki her malzeme ve kapak tipiyle fiyatlanır', (_, definition) => {
    const base = definition.createDefault();

    for (const material of DEFAULT_PRICE_BOOK.materials) {
      for (const doorType of DEFAULT_PRICE_BOOK.doorTypes) {
        const config = { ...base, material: material.id, doorType: doorType.id };
        const parts = definition.parts(config, DEFAULT_PRICE_BOOK);

        expect(() =>
          priceOf(parts, DEFAULT_PRICE_BOOK, selectionOf(config)),
        ).not.toThrow();
      }
    }
  });
});
