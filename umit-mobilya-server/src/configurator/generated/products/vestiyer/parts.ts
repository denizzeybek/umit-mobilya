/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
import { carcassParts } from '../../pricing/carcassParts';

import type { IModuleRect } from '../../pricing/moduleLayout';
import type { IPriceBook } from '../../pricing/priceBook';
import type { IPart } from '../../pricing/types';
import type { IVestiyerConfig, IVestiyerSection } from './types';

/**
 * Vestiyere özel iç donanım: oturak, altında ayakkabılık rafları, üstte şapka
 * rafı ve açık askı çıtası. Gövde ve kapak `pricing/carcassParts` üzerinden
 * geliyor — gardıropla paylaşılan tek şey bunlar.
 *
 * `benchFromFloor` ZEMİNDEN, raf ve askı çıtası TAVANDAN ölçülür.
 */

const CM = 0.01;
const BENCH_THICKNESS_FACTOR = 1.6;
const SHELF_CLEARANCE_CM = 2;

const EMPTY: IVestiyerSection = {
  width: 0,
  benchFromFloor: null,
  shoeShelves: 0,
  shelves: [],
  hookRail: null,
};

const panelPart = (
  rect: IModuleRect,
  label: string,
  width: number,
  thickness: number,
  depth: number,
  y: number,
  z: number,
): IPart => ({
  kind: 'raf',
  partClass: 'panel',
  moduleIndex: rect.index,
  materialRole: 'carcass',
  label,
  qty: 1,
  size: { w: width, h: thickness, d: depth },
  grossSize: { w: width, h: thickness, d: depth },
  bandedEdgeM: width / 100,
  placement: { x: rect.center * CM, y: y * CM, z: z * CM },
});

const interiorParts = (
  rect: IModuleRect,
  section: IVestiyerSection,
  config: IVestiyerConfig,
  t: number,
): IPart[] => {
  const parts: IPart[] = [];
  const back = config.backPanel / 10;
  const shelfDepth = config.depth - back - SHELF_CLEARANCE_CM;
  const z = back / 2;

  const bench = section.benchFromFloor;
  const hasBench = bench !== null && bench > t && bench < config.height - t;

  if (hasBench && bench !== null) {
    parts.push(
      panelPart(rect, 'Oturak', rect.bayWidth, t * BENCH_THICKNESS_FACTOR, shelfDepth, bench, z),
    );

    /* Ayakkabılık rafları oturağın ALTINA yerleşiyor; oturak yoksa yoklar. */
    const gap = bench - t;
    for (let shelf = 1; shelf <= section.shoeShelves; shelf += 1) {
      const y = t + (gap / (section.shoeShelves + 1)) * shelf;
      parts.push(panelPart(rect, 'Ayakkabılık', rect.bayWidth, t, shelfDepth, y, z));
    }
  }

  const floor = hasBench && bench !== null ? bench : t;

  for (const fromTop of section.shelves) {
    const y = config.height - fromTop;
    if (y <= floor + t || y >= config.height - t) continue;
    parts.push(panelPart(rect, 'Raflar', rect.bayWidth, t, shelfDepth, y, z));
  }

  if (section.hookRail !== null) {
    const y = config.height - section.hookRail;
    if (y > floor && y < config.height - t) {
      parts.push({
        kind: 'askilik',
        partClass: 'hardware',
        moduleIndex: rect.index,
        label: 'Askı çıtası',
        qty: 1,
        lengthM: rect.bayWidth / 100,
        size: { w: rect.bayWidth, h: 2.6, d: 2.6 },
        placement: { x: rect.center * CM, y: y * CM, z: z * CM },
      });
    }
  }

  return parts;
};

export const vestiyerParts = (
  config: IVestiyerConfig,
  book: IPriceBook,
): IPart[] => {
  const settings = book.products.vestiyer;
  const bayWidths = config.sections
    .slice(0, config.sectionCount)
    .map((section) => section.width);

  const shell = carcassParts(
    {
      bayWidths,
      height: config.height,
      depth: config.depth,
      backPanel: config.backPanel,
      doorType: config.doorType,
      material: config.material,
    },
    book,
    settings?.maxDoorLeafWidthCm ?? 60,
  );

  const interior = shell.modules.flatMap((rect) =>
    rect.bayWidth <= 0
      ? []
      : interiorParts(
          rect,
          config.sections[rect.index] ?? EMPTY,
          config,
          shell.panelThicknessCm,
        ),
  );

  return [...shell.parts, ...interior];
};
