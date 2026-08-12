import { describe, expect, it } from 'vitest';

import { buildFromParts } from './geometry/buildFromParts';
import { DEFAULT_PRICE_BOOK } from './pricing/defaults';
import { priceOf } from './pricing/priceOf';
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
