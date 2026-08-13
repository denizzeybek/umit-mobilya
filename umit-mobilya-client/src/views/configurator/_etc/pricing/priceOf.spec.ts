import { describe, expect, it } from 'vitest';

import { DEFAULT_PRICE_BOOK } from './defaults';
import { priceOf } from './priceOf';

import type { IPriceBook } from './priceBook';
import type { IPart } from './types';

/**
 * Fiyatın üstüne binen her şeyi (marj, işçilik, KDV, montaj) kapatan bir
 * kitap: malzeme aritmetiğini yalın görebilmek için. Her test yalnızca
 * ölçtüğü kalemi açıyor.
 */
const bare = (extra: Partial<IPriceBook> = {}): IPriceBook => ({
  ...DEFAULT_PRICE_BOOK,
  edgeBand: { pricePerM: 0, appliedTo: 'visible' },
  hardware: {
    hinge: { pricePerUnit: 0, countByDoorHeight: [] },
    handle: { pricePerUnit: 0 },
    drawer: { pricePerUnit: 0 },
    rail: { pricePerM: 0 },
  },
  labour: { method: 'perM2', perM2: 0 },
  delivery: { enabled: false, label: 'Nakliye', flat: 0 },
  margin: { multiplier: 1 },
  vat: { rate: 0, included: false },
  ...extra,
});

const govdePanelleri = (): IPart[] => {
  const yan = (index: number): IPart => ({
    kind: 'yan-panel',
    partClass: 'panel',
    moduleIndex: 0,
    materialRole: 'carcass',
    label: 'Gövde',
    qty: 1,
    size: { w: 1.8, h: 180, d: 60 },
    grossSize: { w: 1.8, h: 180, d: 60 },
    placement: { x: index, y: 0, z: 0 },
  });

  const yatay = (kind: 'ust' | 'alt'): IPart => ({
    kind,
    partClass: 'panel',
    moduleIndex: 0,
    materialRole: 'carcass',
    label: 'Gövde',
    qty: 1,
    size: { w: 56.4, h: 1.8, d: 60 },
    grossSize: { w: 60, h: 1.8, d: 60 },
  });

  return [yan(0), yan(1), yatay('ust'), yatay('alt')];
};

describe('priceOf — gövde aritmetiği', () => {
  /*
   * Kullanıcının el hesabı, birebir: 60 x 180 x 60 tek modül, MDF 2000 ₺/m².
   *   yan  180 x 60 x 2 = 2.16 m²
   *   üst   60 x 60     = 0.36 m²
   *   alt   60 x 60     = 0.36 m²
   *   toplam 2.88 m² x 2000 = 5 760 ₺
   * Bu sayı değişirse fiyatlandırmanın tabanı değişmiş demektir.
   */
  it('5 760 ₺ üretir', () => {
    const price = priceOf(govdePanelleri(), bare(), {
      material: 'mdf-gloss',
      finish: 'beyaz',
      doorType: 'yok',
      backPanel: 8,
    });

    expect(price.total).toBe(5760);
  });

  it('brüt yerine net konvansiyonda daha ucuzdur', () => {
    const book = bare({ areaConvention: 'net' });

    const price = priceOf(govdePanelleri(), book, {
      material: 'mdf-gloss',
      finish: 'beyaz',
      doorType: 'yok',
      backPanel: 8,
    });

    expect(price.total).toBeLessThan(5760);
  });

  it('fire payı toplamı yükseltir', () => {
    const book = bare({ waste: { percent: 10 } });

    const price = priceOf(govdePanelleri(), book, {
      material: 'mdf-gloss',
      finish: 'beyaz',
      doorType: 'yok',
      backPanel: 8,
    });

    expect(price.total).toBe(6336);
  });

  it('bilinmeyen malzeme sessizce ilk malzemeye düşmez, hata verir', () => {
    expect(() =>
      priceOf(govdePanelleri(), bare(), {
        material: 'altin',
        finish: 'beyaz',
        doorType: 'yok',
        backPanel: 8,
      }),
    ).toThrow(/altin/);
  });

  it('gizli malzeme hâlâ fiyatlanır', () => {
    const price = priceOf(govdePanelleri(), bare(), {
      material: 'suntalam',
      finish: 'beyaz',
      doorType: 'yok',
      backPanel: 8,
    });

    expect(price.total).toBe(2.88 * 1400);
  });
});

const secim = {
  material: 'mdf-gloss',
  finish: 'beyaz',
  doorType: 'yok',
  backPanel: 8,
};

const carpanla = (parts: IPart[], multiplier: number): IPart[] =>
  parts.map((part) => ({ ...part, costMultiplier: multiplier }));

/**
 * Köşe modülünün imalat farkı parçaya iliştirilmiş bir çarpan olarak geliyor.
 * Buradaki testler çarpanın PARAYA uygulandığını, ölçüye uygulanmadığını ve
 * yokluğunda hiçbir şeyi değiştirmediğini çiviliyor — üçüncüsü en önemlisi,
 * çünkü tohum kitapta fark 0 ve bugünkü bütün tutarlar ona bağlı.
 */
describe('priceOf — parça maliyet çarpanı', () => {
  it('çarpansız fiyat, çarpanı 1 olan fiyatla aynıdır', () => {
    const duz = priceOf(govdePanelleri(), bare(), secim);
    const birle = priceOf(carpanla(govdePanelleri(), 1), bare(), secim);

    expect(birle.total).toBe(duz.total);
  });

  it('panel maliyetini çarpar', () => {
    const price = priceOf(carpanla(govdePanelleri(), 1.25), bare(), secim);

    expect(price.total).toBe(5760 * 1.25);
  });

  it('donanımı da çarpar', () => {
    const book = bare({
      hardware: {
        hinge: { pricePerUnit: 100, countByDoorHeight: [] },
        handle: { pricePerUnit: 0 },
        drawer: { pricePerUnit: 0 },
        rail: { pricePerM: 0 },
      },
    });
    const menteseler: IPart[] = [
      {
        kind: 'mentese',
        partClass: 'hardware',
        moduleIndex: 0,
        label: 'Menteşeler',
        qty: 4,
        costMultiplier: 1.5,
      },
    ];

    const price = priceOf(menteseler, book, secim);

    expect(price.total).toBe(4 * 100 * 1.5);
  });

  it('kenar bandı metrajı çarpanın dışında kalır', () => {
    const book = bare({ edgeBand: { pricePerM: 50, appliedTo: 'all' } });
    const parts = carpanla(govdePanelleri(), 2);

    const price = priceOf(parts, book, secim);
    const duz = priceOf(govdePanelleri(), book, secim);

    const bant = duz.lines.find((line) => line.label === 'Kenar bandı');
    const bantCarpanli = price.lines.find(
      (line) => line.label === 'Kenar bandı',
    );

    expect(bantCarpanli?.amount).toBe(bant?.amount);
  });

  it('bozuk bir çarpan tutarı düşürmez, yok sayılır', () => {
    const price = priceOf(carpanla(govdePanelleri(), Number.NaN), bare(), secim);

    expect(price.total).toBe(5760);
  });
});
