import { carcassLines, mergeLines } from '../../price/shared';

import { PART_PRICES } from './options';

import type { IPriceBreakdown, IPriceLine } from '../../price/shared';
import type { IVestiyerConfig } from './types';

/**
 * Vestiyere özel kalemler. Gövde/kapak/arkalık `price/shared.ts` üzerinden
 * geliyor ve gardıropla aynı — atölye aynı paneli aynı fiyata işliyor.
 */
const REFERENCE_SECTION_WIDTH = 70;

const fittingLines = (config: IVestiyerConfig): IPriceLine[] => {
  let bench = 0;
  let shoeShelves = 0;
  let shelves = 0;
  let hooks = 0;

  for (const section of config.sections.slice(0, config.sectionCount)) {
    const factor = section.width / REFERENCE_SECTION_WIDTH;

    if (section.benchFromFloor !== null) {
      bench += PART_PRICES.bench * factor;
      shoeShelves += section.shoeShelves * PART_PRICES.shoeShelf * factor;
    }

    shelves += section.shelves.length * PART_PRICES.shelf * factor;
    if (section.hookRail !== null) hooks += PART_PRICES.hookRail * factor;
  }

  return [
    { label: 'Oturak', amount: bench },
    { label: 'Ayakkabılık rafları', amount: shoeShelves },
    { label: 'Raflar', amount: shelves },
    { label: 'Askılıklar', amount: hooks },
  ];
};

export const estimateVestiyerPrice = (
  config: IVestiyerConfig,
): IPriceBreakdown => mergeLines(carcassLines(config), fittingLines(config));
