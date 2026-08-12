import { describe, expect, it } from 'vitest';

import { carcassParts } from './carcassParts';
import { DEFAULT_PRICE_BOOK } from './defaults';
import { doorLeafCount, hingeCountFor, moduleRects } from './moduleLayout';
import { priceOf } from './priceOf';

import type { ICarcassInput } from './carcassParts';

const input = (extra: Partial<ICarcassInput> = {}): ICarcassInput => ({
  bayWidths: [56.4],
  height: 180,
  depth: 60,
  backPanel: 8,
  doorType: 'yok',
  material: 'mdf-gloss',
  ...extra,
});

const build = (extra: Partial<ICarcassInput> = {}, maxLeaf = 60) =>
  carcassParts(input(extra), DEFAULT_PRICE_BOOK, maxLeaf);

const countOf = (parts: { kind: string }[], kind: string) =>
  parts.filter((p) => p.kind === kind).length;

describe('moduleRects', () => {
  it('modüller yan yana dizilir ve gövdeyi ortalar', () => {
    const rects = moduleRects([56.4, 56.4], 1.8);

    expect(rects[0].outerWidth).toBeCloseTo(60, 6);
    expect(rects[0].left).toBeCloseTo(-60, 6);
    expect(rects[1].right).toBeCloseTo(60, 6);
  });

  /*
   * G1'in ölçülebilir sonucu: iki komşu modül arasında İKİ panel var, bir
   * bölme değil. Eski tek kabuk modeli burada tek panel sayıyordu.
   */
  it('komşu modüller arasında iki panel kalınlığı vardır', () => {
    const rects = moduleRects([50, 50], 1.8);

    expect(rects[1].left - rects[0].right).toBeCloseTo(0, 6);
    expect(rects[0].outerWidth - rects[0].bayWidth).toBeCloseTo(3.6, 6);
  });
});

describe('doorLeafCount', () => {
  it('modül tavana sığıyorsa tek kanat', () => {
    expect(doorLeafCount(55, 60)).toBe(1);
  });

  it('200 cm modül 60 cm tavanla dört kanada bölünür', () => {
    expect(doorLeafCount(200, 60)).toBe(4);
  });

  it('yukarı yuvarlar: 130 cm üç kanat eder, iki değil', () => {
    expect(doorLeafCount(130, 60)).toBe(3);
  });
});

describe('hingeCountFor', () => {
  const steps = DEFAULT_PRICE_BOOK.hardware.hinge.countByDoorHeight;

  it('sınır değerinde alttaki kademede kalır', () => {
    expect(hingeCountFor(100, steps)).toBe(2);
  });

  it('sınırı bir santim geçince üst kademeye çıkar', () => {
    expect(hingeCountFor(101, steps)).toBe(3);
  });

  it('en üst kademenin üstünde son değeri verir', () => {
    expect(hingeCountFor(400, steps)).toBe(6);
  });
});

describe('carcassParts', () => {
  it('tek modül dört gövde paneli ve bir arkalık üretir', () => {
    const { parts } = build();

    expect(countOf(parts, 'yan-panel')).toBe(2);
    expect(countOf(parts, 'ust')).toBe(1);
    expect(countOf(parts, 'alt')).toBe(1);
    expect(countOf(parts, 'arkalik')).toBe(1);
  });

  /* G1'in kanıtı: üç bölüm 12 gövde paneli + 3 arkalık demek. */
  it('üç modül on iki gövde paneli ve üç arkalık üretir', () => {
    const { parts } = build({ bayWidths: [96.4, 96.4, 96.4] });

    const govde =
      countOf(parts, 'yan-panel') + countOf(parts, 'ust') + countOf(parts, 'alt');

    expect(govde).toBe(12);
    expect(countOf(parts, 'arkalik')).toBe(3);
  });

  it('üst panel kesim ölçüsü iç, brüt ölçüsü dış genişliktir', () => {
    const { parts } = build();
    const ust = parts.find((p) => p.kind === 'ust');

    expect(ust?.size?.w).toBeCloseTo(56.4, 6);
    expect(ust?.grossSize?.w).toBeCloseTo(60, 6);
  });

  it('arkalık gizlidir', () => {
    const { parts } = build();

    expect(parts.find((p) => p.kind === 'arkalik')?.hidden).toBe(true);
  });

  it('kapaksızda kapak, menteşe ve kulp üretilmez', () => {
    const { parts } = build({ doorType: 'yok' });

    expect(countOf(parts, 'kapak')).toBe(0);
    expect(countOf(parts, 'mentese')).toBe(0);
    expect(countOf(parts, 'kulp')).toBe(0);
  });

  /*
   * 3.3c'nin asıl bedeli: 200 cm modülü tek kanat sayan bir hesap menteşeyi
   * ve kulpu DÖRTTE BİR gösterirdi. Kapak alanı ise değişmez.
   */
  it('200 cm modül dört kanat, menteşe ve kulp buna göre artar', () => {
    const dar = build({ bayWidths: [56.4], doorType: 'standart' });
    const genis = build({ bayWidths: [196.4], doorType: 'standart' });

    expect(countOf(dar.parts, 'kapak')).toBe(1);
    expect(countOf(genis.parts, 'kapak')).toBe(4);

    const menteseOf = (p: typeof dar.parts) =>
      p.find((x) => x.kind === 'mentese')?.qty ?? 0;
    const kulpOf = (p: typeof dar.parts) =>
      p.find((x) => x.kind === 'kulp')?.qty ?? 0;

    expect(menteseOf(genis.parts)).toBe(menteseOf(dar.parts) * 4);
    expect(kulpOf(genis.parts)).toBe(4);
  });

  it('kanat sayısı kapak toplam alanını değiştirmez', () => {
    const selection = {
      material: 'mdf-gloss',
      finish: 'beyaz',
      doorType: 'standart',
      backPanel: 8,
    };
    const book = {
      ...DEFAULT_PRICE_BOOK,
      hardware: {
        ...DEFAULT_PRICE_BOOK.hardware,
        hinge: { pricePerUnit: 0, countByDoorHeight: [] },
        handle: { pricePerUnit: 0 },
      },
      edgeBand: { pricePerM: 0, appliedTo: 'visible' as const },
      labour: { method: 'perM2' as const, perM2: 0 },
      margin: { multiplier: 1 },
      vat: { rate: 0, included: false },
    };

    const tekKanat = carcassParts(input({ bayWidths: [116.4], doorType: 'standart' }), book, 200);
    const ucKanat = carcassParts(input({ bayWidths: [116.4], doorType: 'standart' }), book, 40);

    const kapakTutari = (parts: typeof tekKanat.parts) =>
      priceOf(parts.filter((p) => p.kind === 'kapak'), book, selection).total;

    expect(kapakTutari(ucKanat.parts)).toBeCloseTo(kapakTutari(tekKanat.parts), 4);
  });

  it('kulpsuz kapakta kulp üretilmez ama menteşe üretilir', () => {
    const { parts } = build({ doorType: 'kulpsuz' });

    expect(countOf(parts, 'kulp')).toBe(0);
    expect(parts.find((p) => p.kind === 'mentese')?.qty).toBeGreaterThan(0);
  });

  it('genişliği sıfır olan bölüm parça üretmez', () => {
    const { parts } = build({ bayWidths: [56.4, 0] });

    expect(countOf(parts, 'yan-panel')).toBe(2);
  });
});
