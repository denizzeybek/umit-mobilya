import { DRAWER_LIMIT } from './options';

import type { IGardiropConfig, IGardiropSection } from './types';

/**
 * Gardıroba özel bölüm işlemleri: raf/askılık düzeni ve çekmece adedi.
 * Ölçü işlemleri (genişlik, yükseklik, bölüm sayısı) her üründe aynı olduğu
 * için `_etc/dimensionOps.ts` altında paylaşılıyor.
 */

/**
 * Düzen değiştirmek bölümü daraltmaz — genişlik korunur. Köşe bayrağı da
 * korunuyor ve aynı sebeple: ikisi de modülün İÇİNE ne konduğuyla ilgili
 * değil, modülün kendisiyle ilgili. Hazır düzen seçmek dolabın köşede
 * durduğunu unutturmamalı.
 */
export const applyLayout = (
  config: IGardiropConfig,
  index: number,
  layout: Omit<IGardiropSection, 'width' | 'corner'>,
): void => {
  const section = config.sections[index];
  if (!section) return;

  config.sections[index] = {
    ...layout,
    width: section.width,
    corner: section.corner === true,
  };
};

export const clearSection = (
  config: IGardiropConfig,
  index: number,
): void => {
  applyLayout(config, index, { shelves: [], rails: [], drawers: 0 });
};

/**
 * Köşe işareti modülün GENİŞLİĞİNE dokunmuyor: o ölçü artık kapak yüzünün
 * genişliği ve köşede de düz modüldekiyle aynı anlama geliyor. Modülün
 * planda kapladığı kare (`genişlik + derinlik`) ondan türüyor.
 */
export const setCorner = (
  config: IGardiropConfig,
  index: number,
  value: boolean,
): void => {
  const section = config.sections[index];
  if (!section) return;

  section.corner = value;
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
