import { DRAWER_LIMIT } from './options';

import type { IGardiropConfig, IGardiropSection } from './types';

/**
 * Gardıroba özel bölüm işlemleri: raf/askılık düzeni ve çekmece adedi.
 * Ölçü işlemleri (genişlik, yükseklik, bölüm sayısı) her üründe aynı olduğu
 * için `_etc/dimensionOps.ts` altında paylaşılıyor.
 */

/** Düzen değiştirmek bölümü daraltmaz — genişlik korunur. */
export const applyLayout = (
  config: IGardiropConfig,
  index: number,
  layout: Omit<IGardiropSection, 'width'>,
): void => {
  const section = config.sections[index];
  if (!section) return;

  config.sections[index] = { ...layout, width: section.width };
};

export const clearSection = (
  config: IGardiropConfig,
  index: number,
): void => {
  applyLayout(config, index, { shelves: [], rails: [], drawers: 0 });
};

export const setDrawers = (
  config: IGardiropConfig,
  index: number,
  value: number,
): void => {
  const section = config.sections[index];
  if (!section) return;

  const rounded = Math.round(value) || 0;
  section.drawers = Math.min(
    Math.max(rounded, DRAWER_LIMIT.min),
    DRAWER_LIMIT.max,
  );
};
