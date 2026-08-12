import { CylinderGeometry, Group, Mesh } from 'three';

import { buildCarcass } from '../../geometry/carcass';
import { buildDoors } from '../../geometry/doors';
import { box, createMaterials, disposeGeometries } from '../../geometry/primitives';
import { CM, T } from '../../geometry/units';

import type { ICarcass } from '../../geometry/carcass';
import type { IProductMaterials } from '../../geometry/primitives';
import type { IProductBuild } from '../../types';
import type { IGardiropConfig, IGardiropSection } from './types';

/**
 * Gardıroba özel olan tek şey: gövdenin İÇİNE ne konduğu. Kabuk, kapaklar ve
 * malzemeler `geometry/` altında paylaşılıyor; vestiyer ve mutfak da onları
 * kullanacak ama kendi iç donanımlarını kendileri çizecek.
 */
const DRAWER_HEIGHT_CM = 18;
const RAIL_RADIUS = 0.014;

const EMPTY_SECTION: IGardiropSection = {
  width: 0,
  shelves: [],
  rails: [],
  drawers: 0,
};

const buildDrawers = (
  group: Group,
  materials: IProductMaterials,
  carcass: ICarcass,
  section: IGardiropSection,
  centerX: number,
  innerWidth: number,
): number => {
  const height = DRAWER_HEIGHT_CM * CM;
  const count = Math.min(
    section.drawers,
    Math.floor((carcass.H - 2 * T) / height),
  );

  for (let index = 0; index < count; index += 1) {
    const y = T + index * height + height / 2;
    group.add(
      box(
        materials.panel,
        innerWidth - 0.006,
        height - 0.006,
        T,
        centerX,
        y,
        carcass.D / 2 - T / 2 - 0.004,
      ),
    );
    group.add(
      box(
        materials.metal,
        innerWidth * 0.42,
        0.008,
        0.012,
        centerX,
        y + height / 2 - 0.03,
        carcass.D / 2,
      ),
    );
  }

  return count * height;
};

/**
 * Raf ve askılık tavandan ölçüldüğü için zemine çevriliyor. Çekmece yığınının
 * içine düşenler ve gövde dışına taşanlar sessizce eleniyor — panelde geçersiz
 * bir sayı yazmak sahneyi bozmasın.
 */
const isInsideBay = (y: number, carcass: ICarcass, floor: number): boolean =>
  y > T + floor && y < carcass.H - T;

export const buildGardirop = (config: IGardiropConfig): IProductBuild => {
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
    const drawerStack = buildDrawers(
      group,
      materials,
      carcass,
      section,
      bay.center,
      bay.width,
    );

    for (const fromTop of section.shelves) {
      const y = carcass.H - fromTop * CM;
      if (!isInsideBay(y, carcass, drawerStack)) continue;
      group.add(
        box(materials.panel, bay.width, T, shelfDepth, bay.center, y, carcass.back / 2),
      );
    }

    for (const fromTop of section.rails) {
      const y = carcass.H - fromTop * CM;
      if (!isInsideBay(y, carcass, drawerStack)) continue;

      const rail = new Mesh(
        new CylinderGeometry(RAIL_RADIUS, RAIL_RADIUS, bay.width, 12),
        materials.metal,
      );
      rail.rotation.z = Math.PI / 2;
      rail.position.set(bay.center, y, carcass.back / 2);
      rail.castShadow = true;
      group.add(rail);
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

