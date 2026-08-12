import type { TAreaConvention } from './priceBook';
import type { IPart, IPartSize } from './types';

/**
 * Bir parçanın alanı ve kenar metrajı. Ayrı dosyada, çünkü brüt/net ayrımı
 * atölyenin nasıl hesapladığına bağlı bir KONVANSİYON — geometrinin değil
 * fiyat kitabının kararı, ve ikisinin karışmaması gerekiyor.
 */

const CM2_PER_M2 = 10_000;
const CM_PER_M = 100;

/**
 * Panelin ince ekseni kalınlıktır; yüzey her zaman en büyük iki eksendir.
 * Bu kural, "kapak alanına derinlik girmez" (C2) maddesini ayrı bir koşul
 * yazmadan karşılıyor: kapağın ince ekseni zaten kalınlığı.
 */
const faceDimensions = (size: IPartSize): [number, number] => {
  const sorted = [size.w, size.h, size.d].sort((a, b) => b - a);
  return [sorted[0], sorted[1]];
};

const sizeFor = (
  part: IPart,
  convention: TAreaConvention,
): IPartSize | undefined => {
  if (part.partClass !== 'panel') return undefined;
  return convention === 'gross' ? (part.grossSize ?? part.size) : part.size;
};

export const areaOf = (part: IPart, convention: TAreaConvention): number => {
  const size = sizeFor(part, convention);
  if (!size) return 0;

  const [a, b] = faceDimensions(size);
  return (a * b) / CM2_PER_M2;
};

export const perimeterOf = (
  part: IPart,
  convention: TAreaConvention,
): number => {
  const size = sizeFor(part, convention);
  if (!size) return 0;

  const [a, b] = faceDimensions(size);
  return (2 * (a + b)) / CM_PER_M;
};

export const edgeLengthOf = (
  part: IPart,
  appliedTo: 'visible' | 'all',
  convention: TAreaConvention,
): number => {
  if (part.partClass !== 'panel') return 0;
  if (appliedTo === 'all') return perimeterOf(part, convention);

  return part.bandedEdgeM ?? 0;
};
