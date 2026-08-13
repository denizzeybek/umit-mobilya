/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
import { carcassParts } from '../../pricing/carcassParts';
import { cornerSideOf, placeIn } from '../../pricing/moduleLayout';

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

/**
 * Köşe modülünün rafı da L: gövdenin iki bacağına iki dikdörtgen olarak
 * oturuyor. Askılık ve çekmece köşede YOK — L açıklıktan çekmece geçmiyor,
 * askı borusu da köşede dönemiyor; panel o alanları köşe modülünde
 * göstermiyor.
 */
const cornerShelfParts = (
  rect: IModuleRect,
  section: IGardiropSection,
  config: IGardiropConfig,
  t: number,
): IPart[] => {
  const depth = config.depth;
  const side = cornerSideOf(rect.outerWidth, depth);
  const face = side - depth;

  const shelf = (
    w: number,
    d: number,
    localX: number,
    localZ: number,
    y: number,
  ): IPart => ({
    kind: 'raf',
    partClass: 'panel',
    moduleIndex: rect.index,
    materialRole: 'carcass',
    label: 'Raflar',
    qty: 1,
    size: { w, h: t, d },
    grossSize: { w, h: t, d },
    bandedEdgeM: face / 100,
    placement: placeIn(rect, localX, y, localZ),
  });

  return section.shelves.flatMap((fromTop) => {
    const y = config.height - fromTop;
    if (y <= t || y >= config.height - t) return [];

    const parts = [shelf(side - 2 * t, depth - t, 0, -side / 2 + depth / 2, y)];
    if (face > 0) {
      parts.push(
        shelf(depth - t, face, side / 2 - depth / 2, -side / 2 + depth + face / 2, y),
      );
    }

    return parts;
  });
};

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
      placement: placeIn(
        rect,
        0,
        t + index * DRAWER_HEIGHT_CM + DRAWER_HEIGHT_CM / 2,
        /* Ön yüz gövde hizasında değil, bir panel kalınlığı İÇERİDE. */
        config.depth / 2 - t / 2,
      ),
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
      placement: placeIn(
        rect,
        0,
        config.height - fromTop,
        (config.backPanel / 10) / 2,
      ),
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
      placement: placeIn(
        rect,
        0,
        config.height - fromTop,
        (config.backPanel / 10) / 2,
      ),
    });
  }

  return parts;
};

/**
 * Köşe modülünün imalat farkı, o modülün BÜTÜN parçalarına iliştiriliyor:
 * gövde, kapak ve iç donanım aynı köşede kesiliyor ve aynı yerde monte
 * ediliyor, farkı yalnızca kapağa yüklemek keyfî olurdu.
 *
 * Sıranın köşede dönmesi `moduleLayout` işi; burada yalnızca PARA var.
 */
const withCornerCost = (
  parts: IPart[],
  corners: Set<number>,
  multiplier: number,
): IPart[] => {
  if (multiplier === 1 || corners.size === 0) return parts;

  return parts.map((part) =>
    corners.has(part.moduleIndex) ? { ...part, costMultiplier: multiplier } : part,
  );
};

export const gardiropParts = (
  config: IGardiropConfig,
  book: IPriceBook,
): IPart[] => {
  const settings = book.products.gardirop;
  const sections = config.sections.slice(0, config.sectionCount);
  const modules = sections.map((section) => ({
    width: section.width,
    doorLeaves: section.doorLeaves ?? null,
    corner: section.corner === true,
  }));

  const corners = new Set(
    sections.flatMap((section, index) => (section.corner ? [index] : [])),
  );
  const cornerMultiplier = 1 + (settings?.cornerSurchargePercent ?? 0) / 100;

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

  const interior = shell.modules.flatMap((rect) => {
    if (rect.bayWidth <= 0) return [];

    const section = config.sections[rect.index] ?? EMPTY;
    const build = rect.corner ? cornerShelfParts : interiorParts;

    return build(rect, section, config, shell.panelThicknessCm);
  });

  return withCornerCost(
    [...shell.parts, ...interior],
    corners,
    cornerMultiplier,
  );
};
