import { describe, expect, it } from 'vitest';

import { MIN_SECTION_WIDTH, PANEL_THICKNESS_CM } from '../catalog';

import {
  carcassWidthOf,
  evenWidths,
  innerTotalOf,
  sectionWidthRange,
  widthsForTotal,
} from './sectionWidths';

import type { IBaseConfig, IRange } from '../types';

/**
 * Bu dosyanın koruduğu değişmez tek cümle: bölüm genişlikleri toplamı artı
 * panel kalınlıkları, gövde genişliğine TAM eşit olmalı. Eksik kalan her
 * milimetre sahnede gövde kenarında görünür bir boşluk olarak çiziliyor.
 */
const WIDTH_LIMIT: IRange = { min: 60, max: 400, step: 5 };

const configWith = (widths: number[]): IBaseConfig => ({
  width: carcassWidthOf(
    widths.map((width) => ({ width })),
    widths.length,
  ),
  height: 220,
  depth: 60,
  sectionCount: widths.length,
  material: 'lak',
  finish: 'mese',
  backPanel: 8,
  doorStyle: 'kulpsuz',
  doorOpen: 0,
  sections: widths.map((width) => ({ width })),
});

const sum = (values: number[]): number =>
  Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;

describe('carcassWidthOf', () => {
  it('bölüm genişliklerine panel kalınlıklarını ekler', () => {
    const width = carcassWidthOf([{ width: 87.3 }, { width: 87.3 }], 2);

    expect(width).toBe(87.3 * 2 + 3 * PANEL_THICKNESS_CM);
  });

  it('sectionCount dışındaki bölümleri saymaz', () => {
    const sections = [{ width: 50 }, { width: 50 }, { width: 999 }];

    expect(carcassWidthOf(sections, 2)).toBe(50 * 2 + 3 * PANEL_THICKNESS_CM);
  });
});

describe('evenWidths', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    '%i bölümde toplam gövdeye tam oturur',
    (count) => {
      const config = configWith(Array(count).fill(60));

      const widths = evenWidths(config);

      expect(sum(widths)).toBe(innerTotalOf(config));
    },
  );

  it.each([2, 3, 4, 5])('%i bölümde bölümler tam eşit olur', (count) => {
    const config = configWith(Array(count).fill(60));

    const widths = evenWidths(config);

    expect(Math.max(...widths) - Math.min(...widths)).toBe(0);
  });

  /*
   * 7 ve 8 bölümde net genişlik sayıya tam bölünmüyor; artık 0.01 cm'lik
   * adımlarla dağıtıldığı için fark bir adımı geçmemeli. Tek bir bölüme
   * yıkıldığında bu fark 0.2 cm'ye çıkıyor ve gözle görülüyordu.
   */
  it.each([7, 8])('%i bölümde fark bir yuvarlama adımını geçmez', (count) => {
    const config = configWith(Array(count).fill(60));

    const widths = evenWidths(config);

    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(0.01);
  });
});

describe('widthsForTotal', () => {
  it('oranları koruyarak ölçekler', () => {
    const config = configWith([60, 120]);

    const widths = widthsForTotal(config, 300);

    expect(widths[1] / widths[0]).toBeCloseTo(2, 5);
  });

  it('verilen toplama tam oturur', () => {
    const config = configWith([60, 120]);
    const target = 300;

    const widths = widthsForTotal(config, target);

    expect(sum(widths)).toBe(
      Math.round((target - 3 * PANEL_THICKNESS_CM) * 100) / 100,
    );
  });

  it('asgari genişlik sığmadığında eşit böler', () => {
    const config = configWith(Array(8).fill(60));

    const widths = widthsForTotal(config, 60);

    expect(Math.max(...widths) - Math.min(...widths)).toBe(0);
  });
});

describe('sectionWidthRange', () => {
  it('gövdeyi en geniş ölçünün üstüne çıkarmaz', () => {
    const config = configWith([87.3, 87.3, 87.3]);

    const range = sectionWidthRange(config, 1, WIDTH_LIMIT);
    const others = 87.3 * 2;

    expect(range.max).toBe(
      Math.round((WIDTH_LIMIT.max - others - 4 * PANEL_THICKNESS_CM) * 100) /
        100,
    );
  });

  it('alt sınır asgari bölüm genişliğinin altına inmez', () => {
    const config = configWith([200, 200]);

    const range = sectionWidthRange(config, 0, WIDTH_LIMIT);

    expect(range.min).toBeGreaterThanOrEqual(MIN_SECTION_WIDTH);
  });

  it('üst sınır alt sınırın altına düşmez', () => {
    const config = configWith(Array(8).fill(45));

    for (let index = 0; index < 8; index += 1) {
      const range = sectionWidthRange(config, index, WIDTH_LIMIT);
      expect(range.max).toBeGreaterThanOrEqual(range.min);
    }
  });
});
