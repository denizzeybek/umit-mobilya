import { describe, expect, it } from 'vitest';

import { DEFAULT_PRICE_BOOK } from './defaults';
import { priceOf } from './priceOf';
import {
  backPart,
  doorPart,
  hardwarePart,
  shelfPart,
} from './priceOf.spec.parts';

import type { IPriceBook } from './priceBook';

const SELECTION = {
  material: 'mdf-gloss',
  finish: 'beyaz',
  doorType: 'standart',
  backPanel: 8,
} as const;

const book = (extra: Partial<IPriceBook> = {}): IPriceBook => ({
  ...DEFAULT_PRICE_BOOK,
  labour: { method: 'perM2', perM2: 0 },
  margin: { multiplier: 1 },
  vat: { rate: 0, included: false },
  delivery: { enabled: false, label: 'Nakliye', flat: 0 },
  ...extra,
});

const labelsOf = (lines: { label: string }[]) => lines.map((l) => l.label);

describe('gizli kalemler', () => {
  /*
   * Arkalık görünmez maliyet: dökümde satır YOK, toplamda VAR. Bu ikisini
   * aynı anda doğrulamayan bir test, kalemin sessizce toplamdan da düşmesini
   * kaçırırdı.
   */
  it('arkalık dökümde görünmez ama toplama girer', () => {
    const withBack = priceOf([doorPart(), backPart()], book(), SELECTION);
    const withoutBack = priceOf([doorPart()], book(), SELECTION);

    expect(labelsOf(withBack.lines)).not.toContain('Arkalık');
    expect(withBack.total).toBeGreaterThan(withoutBack.total);
  });

  it('marj toplamı yükseltir ama satır açmaz', () => {
    const plain = priceOf([doorPart()], book(), SELECTION);
    const withMargin = priceOf(
      [doorPart()],
      book({ margin: { multiplier: 1.25 } }),
      SELECTION,
    );

    expect(withMargin.lines).toHaveLength(plain.lines.length);
    expect(withMargin.netTotal).toBeCloseTo(plain.netTotal * 1.25, 4);
  });
});

describe('kapak tipi', () => {
  it('dört tip dört farklı toplam verir', () => {
    const totals = ['standart', 'kulpsuz', 'aynali', 'cam'].map(
      (doorType) =>
        priceOf([doorPart()], book(), { ...SELECTION, doorType }).total,
    );

    expect(new Set(totals).size).toBe(4);
  });

  it('kapak tipi farkı alanla ölçeklenir', () => {
    const dar = priceOf([doorPart()], book(), {
      ...SELECTION,
      doorType: 'aynali',
    });
    const genis = priceOf(
      [doorPart({ grossSize: { w: 120, h: 180, d: 1.8 } })],
      book(),
      { ...SELECTION, doorType: 'aynali' },
    );

    expect(genis.total).toBeCloseTo(dar.total * 2, 4);
  });
});

describe('donanım', () => {
  it('menteşe kanat yüksekliğine göre sayılır', () => {
    const parts = [doorPart(), hardwarePart('mentese', 4)];

    const price = priceOf(parts, book(), SELECTION);
    const line = price.lines.find((l) => l.label === 'mentese');

    expect(line?.amount).toBe(4 * DEFAULT_PRICE_BOOK.hardware.hinge.pricePerUnit);
  });

  it('kulp adet üstünden fiyatlanır', () => {
    const price = priceOf([hardwarePart('kulp', 3)], book(), SELECTION);

    expect(price.total).toBe(3 * DEFAULT_PRICE_BOOK.hardware.handle.pricePerUnit);
  });

  /* C8: çekmece TEK parça. Ön paneli ayrıca m² fiyatlanırsa çift sayım olur. */
  it('çekmece adet fiyatıdır, panel olarak fiyatlanmaz', () => {
    const price = priceOf([hardwarePart('cekmece', 2)], book(), SELECTION);

    expect(price.total).toBe(2 * DEFAULT_PRICE_BOOK.hardware.drawer.pricePerUnit);
  });

  it('askılık borusu metrajla fiyatlanır', () => {
    const price = priceOf(
      [hardwarePart('askilik', 1, { lengthM: 0.9 })],
      book(),
      SELECTION,
    );

    expect(price.total).toBeCloseTo(
      0.9 * DEFAULT_PRICE_BOOK.hardware.rail.pricePerM,
      4,
    );
  });
});

describe('kenar bandı', () => {
  it('görünen kenar modunda parçanın metrajını kullanır', () => {
    const price = priceOf([shelfPart()], book(), SELECTION);
    const line = price.lines.find((l) => l.label === 'Kenar bandı');

    expect(line?.amount).toBeCloseTo(
      0.564 * DEFAULT_PRICE_BOOK.edgeBand.pricePerM,
      4,
    );
  });

  it('tüm kenarlar modunda çevre alınır ve daha pahalıdır', () => {
    const visible = priceOf([shelfPart()], book(), SELECTION);
    const all = priceOf(
      [shelfPart()],
      book({ edgeBand: { pricePerM: 45, appliedTo: 'all' } }),
      SELECTION,
    );

    expect(all.total).toBeGreaterThan(visible.total);
  });
});

describe('işçilik', () => {
  const parts = [doorPart()];

  it('m² yönteminde panel alanıyla ölçeklenir', () => {
    const price = priceOf(
      parts,
      book({ labour: { method: 'perM2', perM2: 100 } }),
      SELECTION,
    );
    const line = price.lines.find((l) => l.label === 'İşçilik');

    expect(line?.amount).toBeCloseTo(1.08 * 100, 4);
  });

  it('saat yönteminde saat ücreti x m² başına saat', () => {
    const price = priceOf(
      parts,
      book({
        labour: { method: 'perHour', hourlyRate: 400, hoursPerM2: 0.5 },
      }),
      SELECTION,
    );
    const line = price.lines.find((l) => l.label === 'İşçilik');

    expect(line?.amount).toBeCloseTo(1.08 * 0.5 * 400, 4);
  });

  it('yüzde yönteminde malzeme toplamının yüzdesidir', () => {
    const price = priceOf(
      parts,
      book({ labour: { method: 'percentOfMaterial', percentOfMaterial: 20 } }),
      SELECTION,
    );
    const material = price.lines.find((l) => l.label === 'Kapak');
    const labour = price.lines.find((l) => l.label === 'İşçilik');

    expect(labour?.amount).toBeCloseTo((material?.amount ?? 0) * 0.2, 4);
  });

  it('montaj sabiti her yöntemde eklenir', () => {
    const without = priceOf(parts, book({ labour: { method: 'perM2' } }), SELECTION);
    const withFlat = priceOf(
      parts,
      book({ labour: { method: 'perM2', assemblyFlat: 500 } }),
      SELECTION,
    );

    expect(withFlat.total - without.total).toBeCloseTo(500, 4);
  });
});

describe('genel giderler', () => {
  it('nakliye kapalıyken satır açılmaz', () => {
    const price = priceOf([doorPart()], book(), SELECTION);

    expect(labelsOf(price.lines)).not.toContain('Nakliye');
  });

  it('nakliye açıkken satır olarak görünür', () => {
    const price = priceOf(
      [doorPart()],
      book({ delivery: { enabled: true, label: 'Nakliye', flat: 2500 } }),
      SELECTION,
    );

    expect(price.lines.find((l) => l.label === 'Nakliye')?.amount).toBe(2500);
  });

  it('KDV ayrı taşınır ve toplama eklenir', () => {
    const price = priceOf(
      [doorPart()],
      book({ vat: { rate: 0.2, included: false } }),
      SELECTION,
    );

    expect(price.vat).toBeCloseTo(price.netTotal * 0.2, 4);
    expect(price.total).toBeCloseTo(price.netTotal + price.vat, 4);
  });

  it('KDV dahil seçilirse ayrıca eklenmez', () => {
    const price = priceOf(
      [doorPart()],
      book({ vat: { rate: 0.2, included: true } }),
      SELECTION,
    );

    expect(price.vat).toBe(0);
    expect(price.total).toBe(price.netTotal);
  });

  it('sıfır tutarlı kalem dökümü kirletmez', () => {
    const price = priceOf([doorPart()], book(), {
      ...SELECTION,
      doorType: 'standart',
    });

    expect(price.lines.every((line) => line.amount > 0)).toBe(true);
  });
});
