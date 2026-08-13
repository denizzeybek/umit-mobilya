import { describe, expect, it } from 'vitest';

import { DEFAULT_PRICE_BOOK } from '../pricing/defaults';
import { createDefaultConfig } from '../products/gardirop/options';
import { gardiropParts } from '../products/gardirop/parts';

import { sceneBoundsOf } from './sceneBounds';

import type { IGardiropConfig } from '../products/gardirop/types';

/**
 * Kameranın sığdıracağı kutu. Düz bir gövdede `config` ölçüleriyle aynı
 * çıkmalı — yoksa köşe için eklenen bu yol, köşesiz her tasarımın kadrajını
 * sessizce oynatır.
 */
const cornerAt = (index: number): IGardiropConfig => {
  const config = createDefaultConfig();
  const section = config.sections[index];
  if (!section) throw new Error(`Varsayılan config'de ${index}. bölüm yok.`);

  section.corner = true;

  return config;
};

const boundsOfConfig = (config: IGardiropConfig) =>
  sceneBoundsOf(gardiropParts(config, DEFAULT_PRICE_BOOK));

describe('sceneBoundsOf', () => {
  it('düz gövdede gövde ölçüleriyle aynıdır', () => {
    const config = createDefaultConfig();
    const bounds = boundsOfConfig(config);

    /* Kapaklar gövdenin önünde durduğu için derinlik bir kapak kalınlığı
       fazla; genişlik ve yükseklik birebir. */
    expect(bounds.width).toBeCloseTo(config.width, 6);
    expect(bounds.height).toBeCloseTo(config.height, 6);
    expect(bounds.depth).toBeGreaterThanOrEqual(config.depth);
    expect(bounds.depth).toBeLessThan(config.depth + 5);
  });

  it('köşe modülü derinliği büyütür, genişliği daraltır', () => {
    const duz = boundsOfConfig(createDefaultConfig());
    const kose = boundsOfConfig(cornerAt(0));

    expect(kose.depth).toBeGreaterThan(duz.depth);
    expect(kose.width).toBeLessThan(duz.width);
  });

  it('parçasız liste sıfır kutu verir', () => {
    expect(sceneBoundsOf([])).toEqual({ width: 0, height: 0, depth: 0 });
  });
});
