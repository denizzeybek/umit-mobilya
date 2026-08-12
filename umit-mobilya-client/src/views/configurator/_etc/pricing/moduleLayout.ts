import type { IHingeStep } from './priceBook';

/**
 * Atölye 3 bölümlü bir gardırobu 3 AYRI KUTU olarak imal eder: her modülün
 * kendi iki yanı, kendi üstü, kendi altı vardır. Bu bir tercih değil, fiziksel
 * zorunluluk — 300 cm'lik tek parça üst panel kesilemez.
 *
 * Eski model tek kabuk + (n-1) bölme çiziyordu ve %27 daha az panel
 * sayıyordu. Ekranda görünen dolapla fiyatı hesaplanan dolap ayrışmasın diye
 * yerleşim de fiyat da artık buradan çıkıyor.
 */

/** Bir modülün cm cinsinden yeri; x ekseni soldan sağa, 0 gövdenin ortası. */
export interface IModuleRect {
  index: number;
  /** Dış genişlik: bölüm genişliği + iki yan panel. */
  outerWidth: number;
  /** İç net genişlik — kullanıcının panele girdiği ölçü. */
  bayWidth: number;
  left: number;
  right: number;
  center: number;
}

export const panelThicknessOf = (thicknessMm: number): number =>
  thicknessMm / 10;

export const moduleRects = (
  bayWidths: number[],
  panelThicknessCm: number,
): IModuleRect[] => {
  const outers = bayWidths.map((bay) => bay + 2 * panelThicknessCm);
  const total = outers.reduce((sum, value) => sum + value, 0);

  const rects: IModuleRect[] = [];
  let cursor = -total / 2;

  outers.forEach((outerWidth, index) => {
    rects.push({
      index,
      outerWidth,
      bayWidth: bayWidths[index],
      left: cursor,
      right: cursor + outerWidth,
      center: cursor + outerWidth / 2,
    });
    cursor += outerWidth;
  });

  return rects;
};

/**
 * 200 cm'lik bir modüle tek kanat kapak takılamaz: sarkar, menteşe taşımaz,
 * açılınca önünde iki metre boşluk ister. Kanat sayısı bu yüzden modül
 * genişliğinden ayrı bir sınıra bağlı — ve menteşe, kulp, kenar bandı
 * adedini doğrudan bu sayı belirliyor.
 */
export const doorLeafCount = (
  outerWidth: number,
  maxDoorLeafWidthCm: number,
): number => {
  if (outerWidth <= 0 || maxDoorLeafWidthCm <= 0) return 0;
  return Math.max(1, Math.ceil(outerWidth / maxDoorLeafWidthCm));
};

/** Menteşe adedi kanat YÜKSEKLİĞİNE göre okunur, genişliğine göre değil. */
export const hingeCountFor = (
  leafHeightCm: number,
  steps: IHingeStep[],
): number => {
  const ordered = [...steps].sort((a, b) => a.maxHeightCm - b.maxHeightCm);
  const step = ordered.find((item) => leafHeightCm <= item.maxHeightCm);

  return step ? step.count : (ordered[ordered.length - 1]?.count ?? 0);
};
