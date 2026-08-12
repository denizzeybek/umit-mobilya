import {
  carcassWidthOf,
  evenWidths,
  sectionWidthRange,
  widthsForTotal,
} from './geometry/sectionWidths';

import type {
  IBaseConfig,
  IBaseSection,
  IProductLimits,
  IRange,
} from './types';

/**
 * Ölçü işlemleri — her ürün tipinde aynı, çünkü hepsi yalnızca `width`,
 * `height`, `depth` ve bölüm genişliklerine dokunuyor. Ürüne özel olan iç
 * donanım işlemleri kendi klasöründe.
 *
 * Korunması gereken değişmez burada: `config.width` bölümlerden TÜRETİLİR.
 * Bölüm genişliklerine dokunan her işlem `syncCarcassWidth` ile bitmek
 * zorunda. Bu kural bileşenlere dağılsaydı, eklenen her yeni alan onu unutma
 * fırsatı olurdu.
 *
 * Sınırlar import edilmez, parametre gelir — gardırop 60-400 cm, mutfak üst
 * dolabı çok daha dar.
 */
const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const syncCarcassWidth = (config: IBaseConfig): void => {
  config.width = carcassWidthOf(config.sections, config.sectionCount);
};

const applyWidths = (config: IBaseConfig, widths: number[]): void => {
  widths.forEach((width, index) => {
    const section = config.sections[index];
    if (section) section.width = width;
  });
};

/**
 * Bölüm genişliği diğer bölümlerden pay almaz: yalnızca kendi ölçüsü değişir,
 * gövde onunla birlikte büyüyüp küçülür.
 */
export const setSectionWidth = (
  config: IBaseConfig,
  index: number,
  value: number,
  widthLimit: IRange,
): void => {
  const section = config.sections[index];
  if (!section) return;

  const range = sectionWidthRange(config, index, widthLimit);
  section.width = clamp(value, range.min, range.max);
  syncCarcassWidth(config);
};

/**
 * Toplam ölçü alanı yazılabilir kalır — "duvarım 240" diyebilmek için. Fark
 * bölümlere oranla dağıtılır, sonra gövde yeniden türetilir.
 */
export const setTotalWidth = (
  config: IBaseConfig,
  value: number,
  widthLimit: IRange,
): void => {
  const clamped = clamp(value, widthLimit.min, widthLimit.max);
  applyWidths(config, widthsForTotal(config, clamped));
  syncCarcassWidth(config);
};

export const setHeight = (
  config: IBaseConfig,
  value: number,
  limit: IRange,
): void => {
  config.height = clamp(value, limit.min, limit.max);
};

export const setDepth = (
  config: IBaseConfig,
  value: number,
  limit: IRange,
): void => {
  config.depth = clamp(value, limit.min, limit.max);
};

/**
 * Yeni bölümün nasıl doldurulacağını ürün bilir — bu yüzden fabrika parametre
 * olarak geliyor. Gardıropta raflı bir bölüm, vestiyerde oturaklı bir bölüm.
 */
export const setSectionCount = (
  config: IBaseConfig,
  count: number,
  limits: IProductLimits,
  createSection: (width: number) => IBaseSection,
): void => {
  const widths = config.sections
    .slice(0, config.sectionCount)
    .map((section) => section.width)
    .filter((width) => width > 0);

  const filler = widths.length
    ? Math.round((widths.reduce((a, b) => a + b, 0) / widths.length) * 100) / 100
    : 90;

  config.sectionCount = clamp(
    count,
    limits.sectionCount.min,
    limits.sectionCount.max,
  );

  while (config.sections.length < config.sectionCount) {
    config.sections.push(createSection(filler));
  }

  syncCarcassWidth(config);
};

export const distributeEvenly = (config: IBaseConfig): void => {
  applyWidths(config, evenWidths(config));
  syncCarcassWidth(config);
};
