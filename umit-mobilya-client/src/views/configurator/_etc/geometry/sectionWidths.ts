import { MIN_SECTION_WIDTH, PANEL_THICKNESS_CM } from '../catalog';

import type { IBaseConfig, IBaseSection, IRange } from '../types';

/**
 * Bölüm genişlikleri efendi, gövde genişliği onları takip eder. Bir bölümü
 * büyütmek diğerlerini daraltmaz — gövde büyür.
 *
 * `config.width` bu yüzden artık bağımsız bir değer değil, bölümlerin türevi:
 * ona yazan tek yer `carcassWidthOf`. Toplam ölçü alanına girilen sayı da
 * doğrudan `width`'e değil, bölümlere oranla dağıtılarak yazılır.
 *
 * Buradaki her fonksiyon saf: config'i değiştirmez, değer döndürür.
 */

const UNITS_PER_CM = 100;

const panelsFor = (sectionCount: number): number =>
  (sectionCount + 1) * PANEL_THICKNESS_CM;

const widthsOf = (config: IBaseConfig): number[] =>
  Array.from(
    { length: config.sectionCount },
    (_, index) => config.sections[index]?.width ?? 0,
  );

const sumOf = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);

/** Bölüm genişlikleri + gövde panelleri = dışarıdan ölçülen toplam genişlik. */
export const carcassWidthOf = (
  sections: IBaseSection[],
  sectionCount: number,
): number =>
  round(
    sumOf(sections.slice(0, sectionCount).map((section) => section.width)) +
      panelsFor(sectionCount),
  );

/** Gövde panelleri düşüldükten sonra bölümlere kalan net genişlik (cm). */
export const innerTotalOf = (config: IBaseConfig): number =>
  round(config.width - panelsFor(config.sectionCount));

/**
 * Bir bölümün alabileceği aralık. Alt sınır asgari bölüm genişliği ya da
 * gövdeyi izin verilen en dar ölçünün altına düşürmeyen değer — hangisi
 * büyükse. Üst sınır da gövdeyi en geniş ölçünün üstüne çıkarmayan değer.
 *
 * Gövde sınırı ÜRÜNE göre değişir (gardırop 60-400, mutfak üst dolabı çok
 * daha dar), bu yüzden import edilmez, parametre olarak gelir. Paylaşılan
 * geometri kodunun hiçbir ürünü tanımaması bu sayede mümkün.
 */
export const sectionWidthRange = (
  config: IBaseConfig,
  index: number,
  widthLimit: IRange,
): { min: number; max: number } => {
  const others = sumOf(
    widthsOf(config).filter((_, at) => at !== index),
  );
  const panels = panelsFor(config.sectionCount);

  const min = Math.max(MIN_SECTION_WIDTH, widthLimit.min - others - panels);
  const max = Math.max(min, widthLimit.max - others - panels);

  return { min: round(min), max: round(max) };
};

/**
 * Toplam ölçü alanına bir sayı girildiğinde bölümler oranlarını koruyarak
 * ölçeklenir. Kullanıcı "duvarım 240" diyebilsin diye bu yol açık kaldı;
 * gövdeye doğrudan yazmak bölümlerle toplamı tutarsız bırakırdı.
 */
export const widthsForTotal = (
  config: IBaseConfig,
  total: number,
): number[] => {
  const inner = total - panelsFor(config.sectionCount);
  const count = config.sectionCount;
  if (count < 1 || inner <= 0) return [];

  const even = inner / count;
  if (even <= MIN_SECTION_WIDTH) return Array(count).fill(round(even));

  const widths = widthsOf(config);
  const sum = sumOf(widths);
  const scaled =
    sum > 0
      ? widths.map((value) => (value / sum) * inner)
      : Array(count).fill(even);

  return spreadToTotal(scaled, inner);
};

/** Mevcut toplamı koruyarak bölümleri eşitler. */
export const evenWidths = (config: IBaseConfig): number[] => {
  const inner = innerTotalOf(config);
  const count = config.sectionCount;
  if (count < 1 || inner <= 0) return [];
  return spreadToTotal(Array(count).fill(inner / count), inner);
};

/** Yeni eklenen bölüme verilecek genişlik: mevcutların ortalaması. */
export const averageWidth = (config: IBaseConfig): number => {
  const widths = widthsOf(config).filter((value) => value > 0);
  if (!widths.length) return 90;
  return round(sumOf(widths) / widths.length);
};

/**
 * Yuvarlama artığını 0.01 cm'lik adımlarla sırayla dağıtır. Tek bir bölüme
 * yıkmak "eşit dağıt"ı gözle eşitsiz gösteriyordu; toplamın tam tutması ise
 * şart, eksik kalan her milimetre sahnede gövde kenarında boşluk oluyor.
 */
function spreadToTotal(widths: number[], total: number): number[] {
  const units = widths.map((value) => Math.round(value * UNITS_PER_CM));
  const targetUnits = Math.round(total * UNITS_PER_CM);
  const minUnits = MIN_SECTION_WIDTH * UNITS_PER_CM;

  let drift = targetUnits - sumOf(units);
  let cursor = 0;
  let guard = Math.abs(drift) + units.length * 2;

  while (drift !== 0 && guard > 0) {
    const index = cursor % units.length;
    const step = drift > 0 ? 1 : -1;

    if (units[index] + step >= minUnits) {
      units[index] += step;
      drift -= step;
    }

    cursor += 1;
    guard -= 1;
  }

  return units.map((value) => value / UNITS_PER_CM);
}

function round(value: number): number {
  return Math.round(value * UNITS_PER_CM) / UNITS_PER_CM;
}
