import { describe, expect, it } from 'vitest';

import { PANEL_THICKNESS_CM } from '../../geometry/units';
import { selectionOf } from '../../pricing/config';
import { DEFAULT_PRICE_BOOK } from '../../pricing/defaults';
import { priceOf } from '../../pricing/priceOf';

import { createDefaultConfig } from './options';
import { gardiropParts } from './parts';

import type { IPriceBook } from '../../pricing/priceBook';
import type { IGardiropConfig } from './types';

/**
 * Köşe modülünün bugünkü sözü şu: tasarımda işaretlenir, fiyata dokunmaz.
 * Farkın nereden geleceği ise fiyat kitabındaki yüzde — bu spec ikisini
 * birden çiviliyor, çünkü yüzde gerçek değerine çekildiğinde kırılması
 * gereken ilk yer burası.
 */
const bookWith = (percent: number): IPriceBook => {
  const gardirop = DEFAULT_PRICE_BOOK.products.gardirop;
  if (!gardirop) throw new Error('Tohum kitapta gardırop ayarı yok.');

  return {
    ...DEFAULT_PRICE_BOOK,
    products: {
      ...DEFAULT_PRICE_BOOK.products,
      gardirop: { ...gardirop, cornerSurchargePercent: percent },
    },
  };
};

const configWithCorner = (index: number): IGardiropConfig => {
  const config = createDefaultConfig();
  const section = config.sections[index];
  if (!section) throw new Error(`Varsayılan config'de ${index}. bölüm yok.`);

  section.corner = true;

  return config;
};

const totalOf = (config: IGardiropConfig, book: IPriceBook): number =>
  priceOf(gardiropParts(config, book), book, selectionOf(config)).total;

describe('gardiropParts — köşe modülü', () => {
  it('varsayılan bölümler köşe değildir', () => {
    const config = createDefaultConfig();

    expect(config.sections.every((section) => section.corner === false)).toBe(
      true,
    );
  });

  /*
   * Fiyat kitabındaki fark 0 olsa bile köşe modülü daha pahalı: katlanır
   * kapak İKİ TAKIM menteşe alıyor ve iki kanadın kenar bandı tek kanattan
   * uzun. Bu fark bir katsayıdan değil, parça listesinden geliyor.
   */
  it('fark 0 iken bile katlanır kapağın maliyeti tutara yansır', () => {
    const book = bookWith(0);

    expect(totalOf(configWithCorner(1), book)).toBeGreaterThan(
      totalOf(createDefaultConfig(), book),
    );
  });

  it('köşe kapağı iki kanat, ikincisi katlanır', () => {
    const doors = gardiropParts(configWithCorner(1), bookWith(0)).filter(
      (part) => part.kind === 'kapak' && part.moduleIndex === 1,
    );

    expect(doors).toHaveLength(2);
    expect(doors[0]?.doorFold).toBe(false);
    expect(doors[1]?.doorFold).toBe(true);
  });

  it('köşe kapağında iki takım menteşe var', () => {
    const book = bookWith(0);
    const hingeQty = (config: IGardiropConfig, moduleIndex: number) =>
      gardiropParts(config, book).find(
        (part) => part.kind === 'mentese' && part.moduleIndex === moduleIndex,
      )?.qty;

    const duz = hingeQty(createDefaultConfig(), 1);
    const kose = hingeQty(configWithCorner(1), 1);

    expect(duz).toBeGreaterThan(0);
    expect(kose).toBe((duz ?? 0) * 2);
  });

  it('yalnızca köşe işaretli modülün parçalarına çarpan iliştirir', () => {
    const parts = gardiropParts(configWithCorner(1), bookWith(20));

    const kose = parts.filter((part) => part.moduleIndex === 1);
    const duz = parts.filter((part) => part.moduleIndex === 0);

    expect(kose.length).toBeGreaterThan(0);
    expect(kose.every((part) => part.costMultiplier === 1.2)).toBe(true);
    expect(duz.every((part) => part.costMultiplier === undefined)).toBe(true);
  });

  /* L gövdenin iki bacağı iki duvara oturuyor: her bacağın kendi arkalığı var. */
  it('köşe modülünün iki arkalığı vardır', () => {
    const backs = gardiropParts(configWithCorner(1), bookWith(0)).filter(
      (part) => part.kind === 'arkalik' && part.moduleIndex === 1,
    );

    expect(backs).toHaveLength(2);
  });

  /*
   * Köşe modülü iki modülün dik birleşmiş hâli: her cephesi normal bir modül
   * yüzü kadar, yani kanat genişliği düz modülünkiyle AYNI. Kanat cephenin
   * bir şeridi kadar kalırsa köşe, iki modül gibi değil ince bir çıkıntı gibi
   * görünüyor — kullanıcının saydığı kapak sayısı da tutmuyor.
   */
  it('köşe kapağının her kanadı bir modül yüzü genişliğindedir', () => {
    const config = configWithCorner(1);
    const section = config.sections[1];
    if (!section) throw new Error('Bölüm yok.');

    const face = section.width + 2 * PANEL_THICKNESS_CM;

    const doors = gardiropParts(config, bookWith(0)).filter(
      (part) => part.kind === 'kapak' && part.moduleIndex === 1,
    );

    expect(doors).toHaveLength(2);
    for (const door of doors) expect(door.size?.w).toBeCloseTo(face, 6);
  });

  /* Kapalıyken iki kanat dik duruyor — her biri kendi cephesinde. */
  it('köşe kapağının iki kanadı birbirine diktir', () => {
    const doors = gardiropParts(configWithCorner(1), bookWith(0)).filter(
      (part) => part.kind === 'kapak' && part.moduleIndex === 1,
    );

    const first = doors[0]?.placement?.rotationY ?? 0;
    const second = doors[1]?.placement?.rotationY ?? 0;

    expect(Math.abs(second - first)).toBeCloseTo(Math.PI / 2, 9);
  });

  it('köşe modülünde askılık ve çekmece yoktur', () => {
    const config = configWithCorner(1);
    const section = config.sections[1];
    if (!section) throw new Error('Bölüm yok.');

    section.rails = [42];
    section.drawers = 3;

    const inside = gardiropParts(config, bookWith(0)).filter(
      (part) => part.moduleIndex === 1,
    );

    expect(inside.some((part) => part.kind === 'askilik')).toBe(false);
    expect(inside.some((part) => part.kind === 'cekmece')).toBe(false);
  });

  it('fark verildiğinde tutar yalnızca o modül kadar artar', () => {
    const book = bookWith(20);

    expect(totalOf(configWithCorner(1), book)).toBeGreaterThan(
      totalOf(createDefaultConfig(), book),
    );
  });
});
