import { EProductType } from './types';

/**
 * Ürünlerin yalnızca kimliği ve adı — başka hiçbir şey.
 *
 * `registry.ts` ürün TANIMLARINI tutuyor; onu import etmek `build.ts`
 * üzerinden Three.js'i ve panel bileşenlerini de beraberinde getiriyor.
 * Menü yalnızca "hangi ürünler var ve adları ne" bilgisine ihtiyaç duyduğu
 * için bu liste ayrı: üst menü registry'yi import ettiğinde ana paket
 * 1.741 kB'den 2.237 kB'ye çıkıyordu ve konfigüratörün tembel yüklenmesi
 * anlamsızlaşıyordu.
 *
 * Ürün adlarının tek kaynağı burası; tanımlar da adını buradan okur.
 */
export const PRODUCT_SUMMARIES: { id: EProductType; label: string }[] = [
  { id: EProductType.Gardirop, label: 'Gardırop' },
  { id: EProductType.Vestiyer, label: 'Vestiyer' },
];

export const productLabel = (id: EProductType): string =>
  PRODUCT_SUMMARIES.find((product) => product.id === id)?.label ?? '';
