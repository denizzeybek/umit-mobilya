import VestiyerFields from '../../../_components/products/vestiyer/VestiyerFields.vue';
import { DEFAULT_PRICE_BOOK } from '../../pricing/defaults';
import { productLabel } from '../../productList';
import { EProductType, limitsOf } from '../../types';

import { createDefaultConfig, createSection } from './options';
import { vestiyerParts } from './parts';

import type { IBaseConfig, IProductDefinition } from '../../types';
import type { IVestiyerConfig } from './types';

/**
 * Registry heterojen ürün tiplerini tek tabloda tuttuğu için sözleşme
 * `IBaseConfig` üzerinden konuşuyor; daraltma ürünün kendi sınırında.
 */
const narrow = (config: IBaseConfig): IVestiyerConfig =>
  config as IVestiyerConfig;

export const vestiyerDefinition: IProductDefinition = {
  id: EProductType.Vestiyer,
  label: productLabel(EProductType.Vestiyer),
  eyebrow: 'Özel ölçü vestiyer',
  headline: 'Antreni tasarla.',
  lede:
    'Oturağı, ayakkabılığı ve askıyı kendi ölçüne göre kur. Soldaki vestiyer ' +
    'her değişiklikte anında güncellenir.',
  limits: limitsOf(DEFAULT_PRICE_BOOK.products.vestiyer),
  createDefault: createDefaultConfig,
  createSection,
  parts: (config, book) => vestiyerParts(narrow(config), book),
  fields: VestiyerFields,
};
