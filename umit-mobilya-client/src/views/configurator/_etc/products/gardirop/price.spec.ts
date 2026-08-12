import { describe, expect, it } from 'vitest';

import { carcassWidthOf } from '../../geometry/sectionWidths';

import { createDefaultConfig } from './options';
import { estimateGardiropPrice } from './price';

import type { IGardiropConfig, IGardiropSection } from './types';

/**
 * Fiyat tahmini bağlayıcı değil, ama İÇ TUTARLI olmak zorunda: gösterilen
 * dökümün toplamı gösterilen toplama eşit olmalı ve daha çok iş her zaman daha
 * pahalı olmalı. Rakamların kendisi değişebilir; bu testler oranları korur.
 */
const emptySection = (width: number): IGardiropSection => ({
  width,
  shelves: [],
  rails: [],
  drawers: 0,
});

const config = (sections: IGardiropSection[]): IGardiropConfig => ({
  ...createDefaultConfig(),
  sectionCount: sections.length,
  width: carcassWidthOf(sections, sections.length),
  sections,
});

describe('estimateGardiropPrice', () => {
  it('döküm toplamı gösterilen toplamla tutar', () => {
    const price = estimateGardiropPrice(config([emptySection(90)]));

    const sum = price.lines.reduce((total, line) => total + line.amount, 0);

    expect(price.total).toBe(Math.round(sum / 10) * 10);
  });

  it('sıfır tutarlı kalem gösterilmez', () => {
    const price = estimateGardiropPrice({
      ...config([emptySection(90)]),
      doorStyle: 'yok',
    });

    expect(price.lines.some((line) => /Kapak/.test(line.label))).toBe(false);
    expect(price.lines.every((line) => line.amount > 0)).toBe(true);
  });

  it('raf eklendikçe pahalanır', () => {
    const without = estimateGardiropPrice(config([emptySection(90)]));
    const withShelves = estimateGardiropPrice(
      config([{ ...emptySection(90), shelves: [40, 80, 120] }]),
    );

    expect(withShelves.total).toBeGreaterThan(without.total);
  });

  it('çekmece raftan pahalıdır', () => {
    const shelf = estimateGardiropPrice(
      config([{ ...emptySection(90), shelves: [40] }]),
    );
    const drawer = estimateGardiropPrice(
      config([{ ...emptySection(90), drawers: 1 }]),
    );

    expect(drawer.total).toBeGreaterThan(shelf.total);
  });

  /*
   * Bölümler eşit genişlikte olmadığı için raf fiyatı bölümün KENDİ
   * genişliğinden ölçeklenir. Önceki sürüm toplam genişliği bölüm sayısına
   * bölüyordu; 40 cm'lik rafla 140 cm'lik rafı aynı fiyatlıyordu.
   */
  it('geniş bölümdeki raf dar bölümdekinden pahalıdır', () => {
    const narrow = estimateGardiropPrice(
      config([{ ...emptySection(40), shelves: [40] }, emptySection(140)]),
    );
    const wide = estimateGardiropPrice(
      config([emptySection(40), { ...emptySection(140), shelves: [40] }]),
    );

    expect(wide.total).toBeGreaterThan(narrow.total);
  });

  it('daha pahalı malzeme toplamı yükseltir', () => {
    const base = config([emptySection(90)]);

    const cheap = estimateGardiropPrice({ ...base, material: 'suntalam' });
    const pricey = estimateGardiropPrice({ ...base, material: 'mdf-gloss' });

    expect(pricey.total).toBeGreaterThan(cheap.total);
  });

  it('bölüm eklemek toplamı yükseltir', () => {
    const one = estimateGardiropPrice(config([emptySection(90)]));
    const two = estimateGardiropPrice(
      config([emptySection(90), emptySection(90)]),
    );

    expect(two.total).toBeGreaterThan(one.total);
  });

  it('tutarlar tam sayı, toplam onluğa yuvarlı', () => {
    const price = estimateGardiropPrice(config([emptySection(87.3)]));

    expect(price.lines.every((line) => Number.isInteger(line.amount))).toBe(
      true,
    );
    expect(price.total % 10).toBe(0);
  });
});
