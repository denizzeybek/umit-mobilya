import { carcassLines, mergeLines } from '../../price/shared';

import { PART_PRICES } from './options';

import type { IPriceBreakdown, IPriceLine } from '../../price/shared';
import type { IGardiropConfig } from './types';

/**
 * Gardıroba özel kalemler: raf, askılık, çekmece. Gövde/kapak/arkalık
 * `price/shared.ts` üzerinden geliyor ve her ürün tipinde aynı.
 */
const REFERENCE_SECTION_WIDTH = 90;

const fittingLines = (config: IGardiropConfig): IPriceLine[] => {
  let shelves = 0;
  let rails = 0;
  let drawers = 0;

  /*
   * Ölçek çarpanı bölüm başına ayrı: bölümler eşit genişlikte değil, 40 cm'lik
   * rafla 100 cm'lik rafı aynı fiyatlamak yanlış olurdu. Tipik bir bölüm
   * genişliği çarpanı 1 yapıyor.
   */
  for (const section of config.sections.slice(0, config.sectionCount)) {
    const factor = section.width / REFERENCE_SECTION_WIDTH;
    shelves += section.shelves.length * PART_PRICES.shelf * factor;
    rails += section.rails.length * PART_PRICES.rail * factor;
    drawers += section.drawers * PART_PRICES.drawer * factor;
  }

  return [
    { label: 'Raflar', amount: shelves },
    { label: 'Askılıklar', amount: rails },
    { label: 'Çekmeceler', amount: drawers },
  ];
};

export const estimateGardiropPrice = (config: IGardiropConfig): IPriceBreakdown =>
  mergeLines(carcassLines(config), fittingLines(config));

