import { Box3, Mesh } from 'three';
import { describe, expect, it } from 'vitest';

import { applyDoorOpen } from '../../geometry/doors';
import { carcassWidthOf } from '../../geometry/sectionWidths';

import { buildGardirop } from './build';
import { createDefaultConfig, createSection } from './options';

import type { IGardiropConfig } from './types';
import type { Group } from 'three';

/**
 * Sahne saf bir fonksiyondan çıktığı için WebGL'e gerek yok: nesne ağacını
 * kurup ölçüyoruz. Bu testlerin işi ekranda güzel görünmesini doğrulamak
 * değil — gövdeden taşan, sayısı tutmayan veya sızdıran bir şey olmadığını
 * doğrulamak.
 */
const CM = 0.01;
const EPSILON = 0.05;

const meshCount = (group: Group): number => {
  let count = 0;
  group.traverse((child) => {
    if (child instanceof Mesh) count += 1;
  });
  return count;
};

/**
 * Bölümler verildiğinde gövde genişliği ve bölüm sayısı onlardan TÜRETİLİR.
 * Uygulamada bu değişmezi `dimensionOps` koruyor; testte elle tutarsız bir
 * config kurmak, üreticinin savunma amaçlı `doorWidth <= 0` korumasına takılıp
 * yanıltıcı sonuç veriyordu.
 */
const config = (over: Partial<IGardiropConfig> = {}): IGardiropConfig => {
  const base = { ...createDefaultConfig(), ...over };
  if (!over.sections) return base;

  return {
    ...base,
    sectionCount: over.sections.length,
    width: carcassWidthOf(over.sections, over.sections.length),
  };
};

describe('buildGardirop — gövde sınırları', () => {
  it('kapaklar kapalıyken hiçbir parça gövdeden taşmaz', () => {
    const input = config();
    const { group, dispose } = buildGardirop(input);

    const bounds = new Box3().setFromObject(group);
    const halfWidth = (input.width * CM) / 2;

    expect(bounds.min.x).toBeGreaterThanOrEqual(-halfWidth - EPSILON);
    expect(bounds.max.x).toBeLessThanOrEqual(halfWidth + EPSILON);
    expect(bounds.min.y).toBeGreaterThanOrEqual(-EPSILON);
    expect(bounds.max.y).toBeLessThanOrEqual(input.height * CM + EPSILON);

    dispose();
  });

  it('gövde zeminden başlar', () => {
    const { group, dispose } = buildGardirop(config());

    const bounds = new Box3().setFromObject(group);

    expect(bounds.min.y).toBeCloseTo(0, 1);
    dispose();
  });
});

describe('buildGardirop — kapaklar', () => {
  it.each([1, 2, 4, 8])('%i bölümde %i kapak üretir', (sectionCount) => {
    const input = config({
      sections: Array.from({ length: sectionCount }, () => createSection(60)),
    });

    const { doorPivots, dispose } = buildGardirop(input);

    expect(doorPivots).toHaveLength(sectionCount);
    dispose();
  });

  it('kapaksız seçilince hiç kapak üretmez', () => {
    const { doorPivots, dispose } = buildGardirop(config({ doorStyle: 'yok' }));

    expect(doorPivots).toHaveLength(0);
    dispose();
  });

  it('menteşe yönü dışa doğru: ilk yarı sola, ikinci yarı sağa', () => {
    const input = config({
      sections: Array.from({ length: 4 }, () => createSection(60)),
    });

    const { doorPivots, dispose } = buildGardirop(input);

    expect(doorPivots.map((door) => door.hinge)).toEqual([
      'left',
      'left',
      'right',
      'right',
    ]);
    dispose();
  });

  it('kulplu seçilince kulpsuzdan daha fazla parça çizer', () => {
    const withHandle = buildGardirop(config({ doorStyle: 'kulplu' }));
    const without = buildGardirop(config({ doorStyle: 'kulpsuz' }));

    expect(meshCount(withHandle.group)).toBeGreaterThan(
      meshCount(without.group),
    );

    withHandle.dispose();
    without.dispose();
  });
});

describe('applyDoorOpen', () => {
  it('kapalıyken rotasyon sıfır', () => {
    const { doorPivots, dispose } = buildGardirop(config());

    applyDoorOpen(doorPivots, 0);

    expect(doorPivots.every((door) => door.pivot.rotation.y === 0)).toBe(true);
    dispose();
  });

  it('açıkken menteşe yönüne göre ters işaretli döner', () => {
    const { doorPivots, dispose } = buildGardirop(config());

    applyDoorOpen(doorPivots, 1);

    const left = doorPivots.find((door) => door.hinge === 'left');
    const right = doorPivots.find((door) => door.hinge === 'right');

    expect(left?.pivot.rotation.y).toBeLessThan(0);
    expect(right?.pivot.rotation.y).toBeGreaterThan(0);
    dispose();
  });

  it('aralık dışındaki değer kırpılır', () => {
    const { doorPivots, dispose } = buildGardirop(config());

    applyDoorOpen(doorPivots, 99);
    const atMax = doorPivots[0].pivot.rotation.y;
    applyDoorOpen(doorPivots, 1);

    expect(doorPivots[0].pivot.rotation.y).toBe(atMax);
    dispose();
  });
});

describe('buildGardirop — iç donanım', () => {
  it('raf eklendikçe parça sayısı artar', () => {
    const withoutShelves = buildGardirop(
      config({
        sections: [
          { width: 80, shelves: [], rails: [], drawers: 0 },
          { width: 80, shelves: [], rails: [], drawers: 0 },
        ],
      }),
    );
    const base = meshCount(withoutShelves.group);
    withoutShelves.dispose();

    const withShelves = buildGardirop(
      config({
        sections: [
          { width: 80, shelves: [40, 80, 120], rails: [], drawers: 0 },
          { width: 80, shelves: [], rails: [], drawers: 0 },
        ],
      }),
    );

    expect(meshCount(withShelves.group)).toBeGreaterThan(base);
    withShelves.dispose();
  });

  /*
   * Panele geçersiz bir sayı yazmak sahneyi bozmamalı: gövde dışına düşen raf
   * sessizce elenir. Bu davranış olmadan 500 cm'lik bir raf tavanın üstünde
   * havada duruyordu.
   */
  it('gövde dışına düşen rafı çizmez', () => {
    const inside = buildGardirop(
      config({
        sections: [
          { width: 80, shelves: [50], rails: [], drawers: 0 },
          { width: 80, shelves: [], rails: [], drawers: 0 },
        ],
      }),
    );
    const outside = buildGardirop(
      config({
        sections: [
          { width: 80, shelves: [5000], rails: [], drawers: 0 },
          { width: 80, shelves: [], rails: [], drawers: 0 },
        ],
      }),
    );

    expect(meshCount(outside.group)).toBeLessThan(meshCount(inside.group));

    inside.dispose();
    outside.dispose();
  });

  it('çekmece yığınının içine düşen rafı çizmez', () => {
    const clear = buildGardirop(
      config({
        sections: [
          { width: 80, shelves: [40], rails: [], drawers: 5 },
          { width: 80, shelves: [], rails: [], drawers: 0 },
        ],
      }),
    );
    const buried = buildGardirop(
      config({
        sections: [
          { width: 80, shelves: [215], rails: [], drawers: 5 },
          { width: 80, shelves: [], rails: [], drawers: 0 },
        ],
      }),
    );

    expect(meshCount(buried.group)).toBeLessThan(meshCount(clear.group));

    clear.dispose();
    buried.dispose();
  });

  it('çekmece sayısı gövdeye sığdığı kadar çizilir', () => {
    const short = buildGardirop(
      config({
        height: 160,
        sections: [
          { width: 80, shelves: [], rails: [], drawers: 8 },
          { width: 80, shelves: [], rails: [], drawers: 0 },
        ],
      }),
    );

    const bounds = new Box3().setFromObject(short.group);

    expect(bounds.max.y).toBeLessThanOrEqual(160 * CM + EPSILON);
    short.dispose();
  });
});

describe('dispose', () => {
  it('iki kez çağrılınca hata vermez', () => {
    const build = buildGardirop(config());

    expect(() => {
      build.dispose();
      build.dispose();
    }).not.toThrow();
  });
});
