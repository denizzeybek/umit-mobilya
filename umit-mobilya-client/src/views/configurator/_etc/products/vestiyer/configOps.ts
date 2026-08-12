import { SHOE_SHELF_LIMIT } from './options';

import type { IVestiyerConfig, IVestiyerSection } from './types';

/** Düzen değiştirmek bölümü daraltmaz — genişlik korunur. */
export const applyLayout = (
  config: IVestiyerConfig,
  index: number,
  layout: Omit<IVestiyerSection, 'width'>,
): void => {
  const section = config.sections[index];
  if (!section) return;

  config.sections[index] = { ...layout, width: section.width };
};

export const clearSection = (config: IVestiyerConfig, index: number): void => {
  applyLayout(config, index, {
    benchFromFloor: null,
    shoeShelves: 0,
    shelves: [],
    hookRail: null,
  });
};

/**
 * Oturak kaldırıldığında ayakkabılık rafları da sıfırlanır: onlar oturağın
 * altına yerleşiyor, oturak yokken havada duran raflar olurdu.
 */
export const setBench = (
  config: IVestiyerConfig,
  index: number,
  value: number | null,
): void => {
  const section = config.sections[index];
  if (!section) return;

  section.benchFromFloor = value;
  if (value === null) section.shoeShelves = 0;
};

export const setShoeShelves = (
  config: IVestiyerConfig,
  index: number,
  value: number,
): void => {
  const section = config.sections[index];
  if (!section || section.benchFromFloor === null) return;

  const rounded = Math.round(value) || 0;
  section.shoeShelves = Math.min(
    Math.max(rounded, SHOE_SHELF_LIMIT.min),
    SHOE_SHELF_LIMIT.max,
  );
};

export const setHookRail = (
  config: IVestiyerConfig,
  index: number,
  value: number | null,
): void => {
  const section = config.sections[index];
  if (section) section.hookRail = value;
};
