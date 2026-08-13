/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
import type { IHingeStep } from './priceBook';

/**
 * Kapağın kaç kanada bölüneceği ve kanat başına kaç menteşe gerektiği.
 *
 * Yerleşimden ayrı duruyorlar çünkü ikisi de modülün PLANIYLA değil ön yüzüyle
 * ilgili: `moduleLayout` modülün nereye oturduğunu, burası ön yüzün nasıl
 * bölündüğünü söylüyor.
 */

export const MAX_DOOR_LEAVES = 4;

/**
 * Geniş bir modüle tek kanat kapak takılamaz: sarkar, menteşe taşımaz,
 * açılınca önünde bir o kadar boşluk ister. Kanat sayısı bu yüzden modül
 * genişliğinden ayrı bir sınıra bağlı — ve menteşe, kulp ve kenar bandı
 * adedini doğrudan bu sayı belirliyor.
 *
 * `override` verildiğinde KULLANICININ kararı geçerli: panelde bölüme
 * tıklayıp kanat sayısını kendisi seçebiliyor. Tavan yalnızca otomatik modda
 * uygulanıyor, çünkü tavan bir varsayım; kullanıcı ise atölyeyi tanıyan taraf.
 */
export const doorLeafCount = (
  outerWidth: number,
  maxDoorLeafWidthCm: number,
  override?: number | null,
): number => {
  if (outerWidth <= 0) return 0;

  if (override != null && Number.isFinite(override)) {
    return Math.min(Math.max(Math.round(override), 1), MAX_DOOR_LEAVES);
  }

  if (maxDoorLeafWidthCm <= 0) return 1;
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
