/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
import { carcassParts } from '../../pricing/carcassParts';

import type { IModuleRect } from '../../pricing/moduleLayout';
import type { IPriceBook } from '../../pricing/priceBook';
import type { IPart } from '../../pricing/types';
import type { IGardiropConfig, IGardiropSection } from './types';

/**
 * Gardıroba özel olan tek şey: gövdenin İÇİNE ne konduğu. Kabuk, kapaklar ve
 * modül yerleşimi `pricing/` altında paylaşılıyor.
 *
 * Raf ve askılık konumları TAVANDAN ölçülür (cm). Sebebi imalat: usta ölçüyü
 * tavandan alır, kullanıcı da panele gördüğü sayıyı yazar.
 */

const CM = 0.01;
const DRAWER_HEIGHT_CM = 18;
const SHELF_CLEARANCE_CM = 2;

const EMPTY: IGardiropSection = { width: 0, shelves: [], rails: [], drawers: 0 };

/**
 * Çekmece yığınının içine düşen ve gövde dışına taşan raf/askılık sessizce
 * eleniyor: panelde geçersiz bir sayı yazmak sahneyi bozmasın.
 */
const insideBay = (
  fromTop: number,
  height: number,
  t: number,
  drawerStack: number,
): boolean => {
  const y = height - fromTop;
  return y > t + drawerStack && y < height - t;
};

const drawerCountFor = (section: IGardiropSection, height: number, t: number): number =>
  Math.min(
    Math.max(section.drawers, 0),
    Math.floor((height - 2 * t) / DRAWER_HEIGHT_CM),
  );

const interiorParts = (
  rect: IModuleRect,
  section: IGardiropSection,
  config: IGardiropConfig,
  t: number,
): IPart[] => {
  const parts: IPart[] = [];
  const drawers = drawerCountFor(section, config.height, t);
  const drawerStack = drawers * DRAWER_HEIGHT_CM;
  const shelfDepth = config.depth - config.backPanel / 10 - SHELF_CLEARANCE_CM;

  /*
   * Çekmece başına AYRI parça. Fiyat açısından tek kalem olması (C8: birim
   * fiyat rayı ve malzemeyi içerir) bunu değiştirmiyor — `priceOf` etikete
   * göre topluyor, yani beş parça da beş adet ediyor.
   *
   * Tek parçaya çökertilmişti ve sahne beş çekmece yerine yığının ortasında
   * havada duran TEK bir panel çiziyordu.
   */
  for (let index = 0; index < drawers; index += 1) {
    parts.push({
      kind: 'cekmece',
      partClass: 'hardware',
      moduleIndex: rect.index,
      label: 'Çekmeceler',
      qty: 1,
      size: { w: rect.bayWidth, h: DRAWER_HEIGHT_CM, d: t },
      placement: {
        x: rect.center * CM,
        y: (t + index * DRAWER_HEIGHT_CM + DRAWER_HEIGHT_CM / 2) * CM,
        /* Ön yüz gövde hizasında değil, bir panel kalınlığı İÇERİDE. */
        z: (config.depth / 2 - t / 2) * CM,
      },
    });
  }

  for (const fromTop of section.shelves) {
    if (!insideBay(fromTop, config.height, t, drawerStack)) continue;

    parts.push({
      kind: 'raf',
      partClass: 'panel',
      moduleIndex: rect.index,
      materialRole: 'carcass',
      label: 'Raflar',
      qty: 1,
      size: { w: rect.bayWidth, h: t, d: shelfDepth },
      grossSize: { w: rect.bayWidth, h: t, d: shelfDepth },
      /* Yalnızca ön kenar görünüyor; yanlar ve arka gövdenin içinde. */
      bandedEdgeM: rect.bayWidth / 100,
      placement: {
        x: rect.center * CM,
        y: (config.height - fromTop) * CM,
        z: ((config.backPanel / 10) / 2) * CM,
      },
    });
  }

  for (const fromTop of section.rails) {
    if (!insideBay(fromTop, config.height, t, drawerStack)) continue;

    parts.push({
      kind: 'askilik',
      partClass: 'hardware',
      moduleIndex: rect.index,
      label: 'Askılıklar',
      qty: 1,
      lengthM: rect.bayWidth / 100,
      size: { w: rect.bayWidth, h: 2.8, d: 2.8 },
      placement: {
        x: rect.center * CM,
        y: (config.height - fromTop) * CM,
        z: ((config.backPanel / 10) / 2) * CM,
      },
    });
  }

  return parts;
};

export const gardiropParts = (
  config: IGardiropConfig,
  book: IPriceBook,
): IPart[] => {
  const settings = book.products.gardirop;
  const modules = config.sections
    .slice(0, config.sectionCount)
    .map((section) => ({
      width: section.width,
      doorLeaves: section.doorLeaves ?? null,
    }));

  const shell = carcassParts(
    {
      modules,
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
