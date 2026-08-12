import { gardiropDefinition } from './products/gardirop';
import { vestiyerDefinition } from './products/vestiyer';
import { EProductType } from './types';

import type { IProductDefinition } from './types';

/**
 * Ürün tiplerinin tek kayıt yeri. Yeni bir ürün eklemek = klasörünü yazıp
 * buraya bir satır koymak; `Configurator.vue` değişmez.
 *
 * Ürünler birbirini import ETMEZ — ortak kod yalnızca `geometry/`,
 * `price/shared.ts` ve `types.ts` üzerinden akar. Bir ürünün dosyasını
 * değiştirmek diğerini etkileyemez, çünkü aralarında bağ yok.
 */
export const PRODUCTS: Record<EProductType, IProductDefinition> = {
  [EProductType.Gardirop]: gardiropDefinition,
  [EProductType.Vestiyer]: vestiyerDefinition,
};

export const isProductType = (value: string): value is EProductType =>
  Object.values(EProductType).includes(value as EProductType);

export const productOr404 = (slug: string): IProductDefinition | null =>
  isProductType(slug) ? PRODUCTS[slug] : null;
