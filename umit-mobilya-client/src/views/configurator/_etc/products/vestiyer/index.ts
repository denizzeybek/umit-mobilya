import VestiyerFields from '../../../_components/products/vestiyer/VestiyerFields.vue';
import { productLabel } from '../../productList';
import { EProductType } from '../../types';

import { buildVestiyer } from './build';
import { createDefaultConfig, createSection, LIMITS } from './options';
import { estimateVestiyerPrice } from './price';

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
  limits: LIMITS,
  createDefault: createDefaultConfig,
  createSection,
  build: (config) => buildVestiyer(narrow(config)),
  price: (config) => estimateVestiyerPrice(narrow(config)),
  fields: VestiyerFields,
};
