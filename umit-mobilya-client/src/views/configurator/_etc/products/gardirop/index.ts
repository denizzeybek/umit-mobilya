import GardiropFields from '../../../_components/products/gardirop/GardiropFields.vue';
import { productLabel } from '../../productList';
import { EProductType } from '../../types';

import { buildGardirop } from './build';
import { createDefaultConfig, createSection, LIMITS } from './options';
import { estimateGardiropPrice } from './price';

import type { IBaseConfig, IProductDefinition } from '../../types';
import type { IGardiropConfig } from './types';

/**
 * Gardırobun kayıt defterine verdiği yüz. Registry heterojen ürün tiplerini
 * tek tabloda tuttuğu için sözleşme `IBaseConfig` üzerinden konuşuyor;
 * daraltma ürünün kendi sınırında, tek satırda yapılıyor. Bu, her ürünün
 * kendi config şeklini bilmesini sağlarken registry'yi jenerik olmaktan
 * kurtarıyor.
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
  limits: LIMITS,
  createDefault: createDefaultConfig,
  createSection,
  build: (config) => buildGardirop(narrow(config)),
  price: (config) => estimateGardiropPrice(narrow(config)),
  fields: GardiropFields,
};
