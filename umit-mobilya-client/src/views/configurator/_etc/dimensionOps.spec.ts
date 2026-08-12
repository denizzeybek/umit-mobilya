import { describe, expect, it } from 'vitest';

import { carcassWidthOf } from './geometry/sectionWidths';
import { gardiropDefinition } from './products/gardirop';
import { createDefaultConfig } from './products/gardirop/options';

const LIMITS = gardiropDefinition.limits;
import {
  distributeEvenly,
  setDepth,
  setHeight,
  setSectionCount,
  setSectionWidth,
  setTotalWidth,
} from './dimensionOps';

import type { IBaseConfig } from './types';

/**
 * Korunan değişmez: `config.width` bölümlerden TÜRETİLİR. Bu dosyadaki her
 * test, gövdeyi bölümlerin toplamıyla karşılaştırarak onu doğruluyor —
 * ölçü işlemlerine yeni bir alan eklenip `syncCarcassWidth` unutulursa
 * buradan patlar.
 */
const expectCarcassMatchesSections = (config: IBaseConfig): void => {
  expect(config.width).toBe(
    carcassWidthOf(config.sections, config.sectionCount),
  );
};

const gardirop = (): IBaseConfig => createDefaultConfig();

describe('setSectionWidth', () => {
  it('diğer bölümleri daraltmaz, gövdeyi büyütür', () => {
    const config = gardirop();
    const before = config.sections[1].width;
    const widthBefore = config.width;

    setSectionWidth(config, 0, 150, LIMITS.width);

    expect(config.sections[0].width).toBe(150);
    expect(config.sections[1].width).toBe(before);
    expect(config.width).toBeGreaterThan(widthBefore);
    expectCarcassMatchesSections(config);
  });

  it('küçültünce gövde de küçülür', () => {
    const config = gardirop();
    const widthBefore = config.width;

    setSectionWidth(config, 0, 30, LIMITS.width);

    expect(config.width).toBeLessThan(widthBefore);
    expectCarcassMatchesSections(config);
  });

  it('gövdeyi izin verilen en geniş ölçünün üstüne çıkarmaz', () => {
    const config = gardirop();

    setSectionWidth(config, 0, 9999, LIMITS.width);

    expect(config.width).toBeLessThanOrEqual(LIMITS.width.max);
    expectCarcassMatchesSections(config);
  });

  it('sayı olmayan değerde alt sınıra çeker', () => {
    const config = gardirop();

    setSectionWidth(config, 0, Number.NaN, LIMITS.width);

    expect(Number.isFinite(config.sections[0].width)).toBe(true);
    expectCarcassMatchesSections(config);
  });

  it('olmayan bölüm sessizce yok sayılır', () => {
    const config = gardirop();
    const snapshot = JSON.stringify(config);

    setSectionWidth(config, 99, 100, LIMITS.width);

    expect(JSON.stringify(config)).toBe(snapshot);
  });
});

describe('setTotalWidth', () => {
  it('farkı bölümlere oranla dağıtır', () => {
    const config = gardirop();
    setSectionWidth(config, 0, 60, LIMITS.width);
    setSectionWidth(config, 1, 120, LIMITS.width);

    setTotalWidth(config, 300, LIMITS.width);

    expect(config.sections[1].width / config.sections[0].width).toBeCloseTo(2, 4);
    expectCarcassMatchesSections(config);
  });

  it('sınırların dışına çıkmaz', () => {
    const config = gardirop();

    setTotalWidth(config, 10_000, LIMITS.width);

    expect(config.width).toBeLessThanOrEqual(LIMITS.width.max);
    expectCarcassMatchesSections(config);
  });
});

describe('setSectionCount', () => {
  it('mevcut bölümleri daraltmaz, gövdeyi büyütür', () => {
    const config = gardirop();
    const before = [...config.sections.map((section) => section.width)];

    setSectionCount(config, 4, LIMITS, (width) => ({ width }));

    expect(config.sections[0].width).toBe(before[0]);
    expect(config.sections[1].width).toBe(before[1]);
    expect(config.sectionCount).toBe(4);
    expectCarcassMatchesSections(config);
  });

  it('yeni bölümü ürünün fabrikasıyla üretir', () => {
    const config = gardirop();

    setSectionCount(config, 3, LIMITS, (width) => ({ width, marker: true }));

    expect(config.sections[2]).toHaveProperty('marker', true);
  });

  it('sınırların dışındaki sayıyı kırpar', () => {
    const config = gardirop();

    setSectionCount(config, 99, LIMITS, (width) => ({ width }));

    expect(config.sectionCount).toBe(LIMITS.sectionCount.max);
  });

  /*
   * Bölüm sayısı azaltıldığında fazla bölümler dizide kalır ama sayılmaz;
   * kullanıcı geri arttırdığında düzeni geri gelsin diye. Gövde yine de
   * yalnızca sayılan bölümlerden hesaplanmalı.
   */
  it('azaltınca gövde yalnızca sayılan bölümlerden hesaplanır', () => {
    const config = gardirop();
    setSectionCount(config, 4, LIMITS, (width) => ({ width }));

    setSectionCount(config, 2, LIMITS, (width) => ({ width }));

    expect(config.sectionCount).toBe(2);
    expectCarcassMatchesSections(config);
  });
});

describe('distributeEvenly', () => {
  it('gövde ölçüsünü korur ve bölümleri eşitler', () => {
    const config = gardirop();
    setSectionWidth(config, 0, 140, LIMITS.width);
    const widthBefore = config.width;

    distributeEvenly(config);

    expect(config.width).toBe(widthBefore);
    expect(config.sections[0].width).toBe(config.sections[1].width);
    expectCarcassMatchesSections(config);
  });
});

describe('setHeight / setDepth', () => {
  it('sınırlara çeker', () => {
    const config = gardirop();

    setHeight(config, 9999, LIMITS.height);
    setDepth(config, 0, LIMITS.depth);

    expect(config.height).toBe(LIMITS.height.max);
    expect(config.depth).toBe(LIMITS.depth.min);
  });

  it('gövde genişliğine dokunmaz', () => {
    const config = gardirop();
    const widthBefore = config.width;

    setHeight(config, 200, LIMITS.height);

    expect(config.width).toBe(widthBefore);
  });
});
