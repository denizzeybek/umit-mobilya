import { PANEL_THICKNESS_CM } from '../../catalog';

import type { IProductLimits } from '../../types';
import type { IVestiyerConfig, IVestiyerSection } from './types';

/**
 * Vestiyer gardıroptan daha sığ ve daha alçak: antrede duruyor, içine palto
 * asılıyor ama gardırop derinliği kapıyı kapatır.
 */
export const LIMITS: IProductLimits = {
  width: { min: 60, max: 320, step: 5 },
  height: { min: 140, max: 240, step: 5 },
  depth: { min: 28, max: 45, step: 1 },
  sectionCount: { min: 1, max: 5 },
};

export const SHOE_SHELF_LIMIT = { min: 0, max: 4 };

export const PART_PRICES = {
  bench: 1450,
  shoeShelf: 320,
  shelf: 380,
  hookRail: 540,
};

export const PRESETS: {
  id: string;
  label: string;
  build: () => Omit<IVestiyerSection, 'width'>;
}[] = [
  {
    id: 'oturakli',
    label: 'Oturaklı',
    build: () => ({
      benchFromFloor: 45,
      shoeShelves: 2,
      shelves: [25],
      hookRail: 60,
    }),
  },
  {
    id: 'askilik',
    label: 'Sadece askılık',
    build: () => ({
      benchFromFloor: null,
      shoeShelves: 0,
      shelves: [25],
      hookRail: 60,
    }),
  },
  {
    id: 'ayakkabilik',
    label: 'Ayakkabılık',
    build: () => ({
      benchFromFloor: 50,
      shoeShelves: 4,
      shelves: [],
      hookRail: null,
    }),
  },
  {
    id: 'rafli',
    label: 'Raflı',
    build: () => ({
      benchFromFloor: null,
      shoeShelves: 0,
      shelves: [25, 60, 95, 130],
      hookRail: null,
    }),
  },
];

export const createSection = (width: number): IVestiyerSection => ({
  width,
  benchFromFloor: 45,
  shoeShelves: 2,
  shelves: [25],
  hookRail: 60,
});

/**
 * Açılış eşit bölünmüş ve KAPAKSIZ: vestiyer açık bir mobilya, kapak istisna.
 * Genişlikler gövde ölçüsünden hesaplanıyor, sabit yazılmıyor.
 */
export const createDefaultConfig = (): IVestiyerConfig => {
  const width = 140;
  const sectionCount = 2;
  const inner = width - (sectionCount + 1) * PANEL_THICKNESS_CM;
  const each = Math.round((inner / sectionCount) * 100) / 100;

  return {
    width,
    height: 200,
    depth: 35,
    sectionCount,
    material: 'mdf-lam',
    finish: 'mese',
    backPanel: 8,
    doorStyle: 'yok',
    doorOpen: 0,
    sections: Array.from({ length: sectionCount }, () => createSection(each)),
  };
};
