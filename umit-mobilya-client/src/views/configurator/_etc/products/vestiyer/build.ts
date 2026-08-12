import { CylinderGeometry, Group, Mesh } from 'three';

import { buildCarcass } from '../../geometry/carcass';
import { buildDoors } from '../../geometry/doors';
import { box, createMaterials, disposeGeometries } from '../../geometry/primitives';
import { CM, T } from '../../geometry/units';

import type { ICarcass } from '../../geometry/carcass';
import type { IProductMaterials } from '../../geometry/primitives';
import type { IProductBuild } from '../../types';
import type { IVestiyerConfig, IVestiyerSection } from './types';

/**
 * Vestiyere özel iç donanım: oturak, altında ayakkabılık rafları, üstte şapka
 * rafı ve açık askı çıtası. Gövde, kapak ve malzeme `geometry/` altından
 * geliyor — gardıropla paylaşılan tek şey bunlar.
 */
const HOOK_RADIUS = 0.008;
const HOOK_DROP = 0.055;
const HOOK_SPACING_CM = 16;
const BENCH_THICKNESS = T * 1.6;

const EMPTY_SECTION: IVestiyerSection = {
  width: 0,
  benchFromFloor: null,
  shoeShelves: 0,
  shelves: [],
  hookRail: null,
};

/**
 * Askı çıtası ve üstündeki kancalar. Kanca sayısı bölüm genişliğinden
 * türetiliyor: 16 cm'de bir kanca, en az bir tane.
 */
const buildHooks = (
  group: Group,
  materials: IProductMaterials,
  carcass: ICarcass,
  centerX: number,
  innerWidth: number,
  y: number,
): void => {
  const rail = new Mesh(
    new CylinderGeometry(HOOK_RADIUS * 1.6, HOOK_RADIUS * 1.6, innerWidth, 10),
    materials.metal,
  );
  rail.rotation.z = Math.PI / 2;
  rail.position.set(centerX, y, carcass.back / 2);
  rail.castShadow = true;
  group.add(rail);

  const count = Math.max(Math.floor((innerWidth / CM) / HOOK_SPACING_CM), 1);
  const step = innerWidth / (count + 1);

  for (let index = 1; index <= count; index += 1) {
    group.add(
      box(
        materials.metal,
        HOOK_RADIUS * 2,
        HOOK_DROP,
        HOOK_RADIUS * 2,
        centerX - innerWidth / 2 + step * index,
        y - HOOK_DROP / 2,
        carcass.back / 2,
      ),
    );
  }
};

export const buildVestiyer = (config: IVestiyerConfig): IProductBuild => {
  const group = new Group();
  const materials = createMaterials(config.finish, config.material);

  const carcass = buildCarcass(group, materials, {
    width: config.width,
    height: config.height,
    depth: config.depth,
    backPanel: config.backPanel,
    sectionWidths: config.sections
      .slice(0, config.sectionCount)
      .map((section) => section.width),
  });

  const shelfDepth = carcass.D - carcass.back - 0.02;

  carcass.layout.forEach((bay, index) => {
    if (bay.width <= 0) return;

    const section = config.sections[index] ?? EMPTY_SECTION;
    const benchY =
      section.benchFromFloor === null ? null : section.benchFromFloor * CM;
    const hasBench =
      benchY !== null && benchY > T && benchY < carcass.H - T;

    if (hasBench && benchY !== null) {
      group.add(
        box(
          materials.panel,
          bay.width,
          BENCH_THICKNESS,
          shelfDepth,
          bay.center,
          benchY,
          carcass.back / 2,
        ),
      );

      /*
       * Ayakkabılık rafları oturağın ALTINA eşit aralıkla yerleşiyor. Oturak
       * yoksa çizilmiyorlar — havada duran raf olmasın.
       */
      const gap = benchY - T;
      for (let shelf = 1; shelf <= section.shoeShelves; shelf += 1) {
        const y = T + (gap / (section.shoeShelves + 1)) * shelf;
        group.add(
          box(
            materials.panel,
            bay.width,
            T,
            shelfDepth,
            bay.center,
            y,
            carcass.back / 2,
          ),
        );
      }
    }

    const floor = hasBench && benchY !== null ? benchY : T;

    for (const fromTop of section.shelves) {
      const y = carcass.H - fromTop * CM;
      if (y <= floor + T || y >= carcass.H - T) continue;
      group.add(
        box(
          materials.panel,
          bay.width,
          T,
          shelfDepth,
          bay.center,
          y,
          carcass.back / 2,
        ),
      );
    }

    if (section.hookRail !== null) {
      const y = carcass.H - section.hookRail * CM;
      if (y > floor + HOOK_DROP && y < carcass.H - T) {
        buildHooks(group, materials, carcass, bay.center, bay.width, y);
      }
    }
  });

  const doorPivots =
    config.doorStyle === 'yok'
      ? []
      : buildDoors(group, materials, carcass, {
          hasHandle: config.doorStyle === 'kulplu',
        });

  return {
    group,
    doorPivots,
    dispose: () => {
      disposeGeometries(group);
      materials.dispose();
    },
  };
};
