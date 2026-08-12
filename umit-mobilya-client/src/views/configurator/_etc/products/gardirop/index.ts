import GardiropFields from '../../../_components/products/gardirop/GardiropFields.vue';
import { DEFAULT_PRICE_BOOK } from '../../pricing/defaults';
import { productLabel } from '../../productList';
import { EProductType, limitsOf } from '../../types';

import { createDefaultConfig, createSection } from './options';
import { gardiropParts } from './parts';

import type { IBaseConfig, IProductDefinition } from '../../types';
import type { IGardiropConfig } from './types';

/**
 * Gardırobun kayıt defterine verdiği yüz. Registry heterojen ürün tiplerini
 * tek tabloda tuttuğu için sözleşme `IBaseConfig` üzerinden konuşuyor;
 * daraltma ürünün kendi sınırında, tek satırda yapılıyor.
 */
const narrow = (config: IBaseConfig): IGardiropConfig =>
  config as IGardiropConfig;

export const gardiropDefinition: IProductDefinition = {
  id: EProductType.Gardirop,
  label: productLabel(EProductType.Gardirop),
  eyebrow: 'Özel ölçü gardırop',
  headline: 'Dolabını tasarla.',
  lede:
    'Ölçüyü, malzemeyi ve iç düzeni değiştirdikçe soldaki dolap anında ' +
    'değişir. Beğendiğin kurulumu teklife çevir.',
  limits: limitsOf(DEFAULT_PRICE_BOOK.products.gardirop),
  createDefault: createDefaultConfig,
  createSection,
  parts: (config, book) => gardiropParts(narrow(config), book),
  fields: GardiropFields,
};
