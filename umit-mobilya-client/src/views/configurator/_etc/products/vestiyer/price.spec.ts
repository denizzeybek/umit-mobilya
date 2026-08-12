import { describe, expect, it } from 'vitest';

import { carcassWidthOf } from '../../geometry/sectionWidths';

import { createDefaultConfig } from './options';
import { estimateVestiyerPrice } from './price';

import type { IVestiyerConfig, IVestiyerSection } from './types';

const bare = (width: number): IVestiyerSection => ({
  width,
  benchFromFloor: null,
  shoeShelves: 0,
  shelves: [],
  hookRail: null,
});

const config = (sections: IVestiyerSection[]): IVestiyerConfig => ({
  ...createDefaultConfig(),
  sectionCount: sections.length,
  width: carcassWidthOf(sections, sections.length),
  sections,
});

describe('estimateVestiyerPrice', () => {
  it('döküm toplamı gösterilen toplamla tutar', () => {
    const price = estimateVestiyerPrice(config([bare(70)]));

    const sum = price.lines.reduce((total, line) => total + line.amount, 0);

    expect(price.total).toBe(Math.round(sum / 10) * 10);
  });

  it('kapaksız vestiyerde kapak kalemi görünmez', () => {
    const price = estimateVestiyerPrice(config([bare(70)]));

    expect(price.lines.some((line) => /Kapak/.test(line.label))).toBe(false);
  });

  it('oturak toplamı yükseltir', () => {
    const without = estimateVestiyerPrice(config([bare(70)]));
    const withBench = estimateVestiyerPrice(
      config([{ ...bare(70), benchFromFloor: 45 }]),
    );

    expect(withBench.total).toBeGreaterThan(without.total);
  });

  /*
   * Ayakkabılık rafları oturağa bağlı: oturak yoksa çizilmiyorlar, o yüzden
   * fiyatlanmamalılar da. Bu iki tarafın aynı kuralı uyguladığının testi.
   */
  it('oturak yokken ayakkabılık rafı fiyatlanmaz', () => {
    const base = estimateVestiyerPrice(config([bare(70)]));
    const orphanShelves = estimateVestiyerPrice(
      config([{ ...bare(70), shoeShelves: 4 }]),
    );

    expect(orphanShelves.total).toBe(base.total);
  });

  it('askı çıtası toplamı yükseltir', () => {
    const without = estimateVestiyerPrice(config([bare(70)]));
    const withHooks = estimateVestiyerPrice(
      config([{ ...bare(70), hookRail: 60 }]),
    );

    expect(withHooks.total).toBeGreaterThan(without.total);
  });

  it('geniş bölümdeki oturak dar bölümdekinden pahalıdır', () => {
    const narrow = estimateVestiyerPrice(
      config([{ ...bare(40), benchFromFloor: 45 }]),
    );
    const wide = estimateVestiyerPrice(
      config([{ ...bare(140), benchFromFloor: 45 }]),
    );

    expect(wide.total).toBeGreaterThan(narrow.total);
  });

  it('tutarlar tam sayı, toplam onluğa yuvarlı', () => {
    const price = estimateVestiyerPrice(
      config([{ ...bare(67.3), benchFromFloor: 45, hookRail: 60 }]),
    );

    expect(price.lines.every((line) => Number.isInteger(line.amount))).toBe(
      true,
    );
    expect(price.total % 10).toBe(0);
  });
});
