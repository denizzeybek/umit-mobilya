import { Box3, Mesh } from 'three';
import { describe, expect, it } from 'vitest';

import { carcassWidthOf } from '../../geometry/sectionWidths';

import { buildVestiyer } from './build';
import { createDefaultConfig } from './options';

import type { IVestiyerConfig, IVestiyerSection } from './types';
import type { Group } from 'three';

const CM = 0.01;
const EPSILON = 0.05;

const meshCount = (group: Group): number => {
  let count = 0;
  group.traverse((child) => {
    if (child instanceof Mesh) count += 1;
  });
  return count;
};

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

describe('buildVestiyer — gövde', () => {
  it('hiçbir parça gövdeden taşmaz', () => {
    const input = config([bare(60), bare(60)]);
    const { group, dispose } = buildVestiyer(input);

    const bounds = new Box3().setFromObject(group);

    expect(bounds.min.y).toBeGreaterThanOrEqual(-EPSILON);
    expect(bounds.max.y).toBeLessThanOrEqual(input.height * CM + EPSILON);
    expect(bounds.max.x).toBeLessThanOrEqual((input.width * CM) / 2 + EPSILON);
    dispose();
  });

  it('varsayılan vestiyerde kapak yoktur', () => {
    const { doorPivots, dispose } = buildVestiyer(createDefaultConfig());

    expect(doorPivots).toHaveLength(0);
    dispose();
  });

  it('kapak istenirse gövdeyle aynı sayıda üretilir', () => {
    const { doorPivots, dispose } = buildVestiyer({
      ...config([bare(60), bare(60), bare(60)]),
      doorStyle: 'kulplu',
    });

    expect(doorPivots).toHaveLength(3);
    dispose();
  });
});

describe('buildVestiyer — oturak', () => {
  it('oturak eklenince parça sayısı artar', () => {
    const without = buildVestiyer(config([bare(60)]));
    const base = meshCount(without.group);
    without.dispose();

    const withBench = buildVestiyer(
      config([{ ...bare(60), benchFromFloor: 45 }]),
    );

    expect(meshCount(withBench.group)).toBeGreaterThan(base);
    withBench.dispose();
  });

  /*
   * Ayakkabılık rafları oturağın ALTINA yerleşiyor. Oturak yokken onları
   * çizmek havada duran raf demek olurdu — `configOps.setBench` da oturak
   * kaldırılınca rafları sıfırlıyor, ama üretici de kendini korumalı.
   */
  it('oturak yokken ayakkabılık rafı çizmez', () => {
    const noBench = buildVestiyer(
      config([{ ...bare(60), benchFromFloor: null, shoeShelves: 4 }]),
    );
    const empty = buildVestiyer(config([bare(60)]));

    expect(meshCount(noBench.group)).toBe(meshCount(empty.group));

    noBench.dispose();
    empty.dispose();
  });

  it('ayakkabılık rafları oturağın altında kalır', () => {
    const benchHeight = 45;
    const { group, dispose } = buildVestiyer(
      config([{ ...bare(60), benchFromFloor: benchHeight, shoeShelves: 3 }]),
    );

    const bounds = new Box3().setFromObject(group);

    expect(bounds.max.y).toBeGreaterThan(benchHeight * CM);
    dispose();
  });

  it('gövde dışına düşen oturağı çizmez', () => {
    const outside = buildVestiyer(
      config([{ ...bare(60), benchFromFloor: 9999 }]),
    );
    const empty = buildVestiyer(config([bare(60)]));

    expect(meshCount(outside.group)).toBe(meshCount(empty.group));

    outside.dispose();
    empty.dispose();
  });
});

describe('buildVestiyer — askı çıtası', () => {
  it('askı çıtası çıta + kancalar çizer', () => {
    const without = buildVestiyer(config([bare(60)]));
    const base = meshCount(without.group);
    without.dispose();

    const withHooks = buildVestiyer(config([{ ...bare(60), hookRail: 60 }]));

    expect(meshCount(withHooks.group)).toBeGreaterThan(base + 1);
    withHooks.dispose();
  });

  it('geniş bölümde daha çok kanca çizilir', () => {
    const narrow = buildVestiyer(config([{ ...bare(40), hookRail: 60 }]));
    const wide = buildVestiyer(config([{ ...bare(160), hookRail: 60 }]));

    expect(meshCount(wide.group)).toBeGreaterThan(meshCount(narrow.group));

    narrow.dispose();
    wide.dispose();
  });
});

describe('buildVestiyer — raflar', () => {
  it('oturağın altına düşen rafı çizmez', () => {
    const above = buildVestiyer(
      config([{ ...bare(60), benchFromFloor: 45, shelves: [40] }]),
    );
    const below = buildVestiyer(
      config([{ ...bare(60), benchFromFloor: 45, shelves: [195] }]),
    );

    expect(meshCount(below.group)).toBeLessThan(meshCount(above.group));

    above.dispose();
    below.dispose();
  });
});

describe('dispose', () => {
  it('iki kez çağrılınca hata vermez', () => {
    const build = buildVestiyer(createDefaultConfig());

    expect(() => {
      build.dispose();
      build.dispose();
    }).not.toThrow();
  });
});
