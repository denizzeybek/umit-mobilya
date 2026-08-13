/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
import { cornerUnitParts } from './cornerUnitParts';
import { doorLeafCount, hingeCountFor } from './doorLeaves';
import { moduleRects, panelThicknessOf, placeIn } from './moduleLayout';

import type { IModuleRect } from './moduleLayout';
import type { IPriceBook } from './priceBook';
import type { IPart } from './types';

/**
 * Gövde kabuğu ve ön yüz — kasalı her mobilya tipinde aynı. Ürüne özel olan,
 * kabuğun İÇİNE ne konduğu; o kendi klasöründe.
 *
 * Ölçüler cm, yerleşim METRE: sahne metre ölçeğinde çalışıyor (Three.js'in
 * ışık zayıflaması ve gölge kamerası ona göre ayarlı), fiyat ise cm ile.
 *
 * Yerleşim modülün KENDİ çerçevesinde yazılıyor (`placeIn`): yerel +x modülün
 * genişliği, yerel +z cephesi. Köşeden sonra dönen modüller bu sayede tek bir
 * satır bile değiştirmeden doğru yere düşüyor.
 */

export interface ICarcassModule {
  width: number;
  /** `null`/yok = otomatik; sayı = kullanıcının seçtiği kanat sayısı. */
  doorLeaves?: number | null;
  /** Sıra bu modülden sonra 90° döner — köşe modülü. */
  corner?: boolean;
}

export interface ICarcassInput {
  modules: ICarcassModule[];
  height: number;
  depth: number;
  backPanel: number;
  doorType: string;
  /** Panel kalınlığı buradan çıkar: kalınlık malzemenin bir özelliği (C13). */
  material: string;
}

export interface ICarcassParts {
  parts: IPart[];
  modules: IModuleRect[];
  panelThicknessCm: number;
}

const sidePart = (
  rect: IModuleRect,
  localX: number,
  input: ICarcassInput,
  t: number,
): IPart => ({
  kind: 'yan-panel',
  partClass: 'panel',
  moduleIndex: rect.index,
  materialRole: 'carcass',
  label: 'Gövde',
  qty: 1,
  size: { w: t, h: input.height, d: input.depth },
  grossSize: { w: t, h: input.height, d: input.depth },
  placement: placeIn(rect, localX, input.height / 2, 0),
});

/**
 * Üst ve alt paneller iki yanın ARASINA giriyor, yani kesim ölçüsü modülün
 * dış genişliğinden iki panel kalınlığı eksik. Brüt konvansiyonda ise dış
 * ölçüyle fiyatlanıyorlar — atölye böyle hesaplıyor, `grossSize` bu yüzden var.
 */
const horizontalPart = (
  rect: IModuleRect,
  kind: 'ust' | 'alt',
  input: ICarcassInput,
  t: number,
): IPart => ({
  kind,
  partClass: 'panel',
  moduleIndex: rect.index,
  materialRole: 'carcass',
  label: 'Gövde',
  qty: 1,
  size: { w: rect.bayWidth, h: t, d: input.depth },
  grossSize: { w: rect.outerWidth, h: t, d: input.depth },
  placement: placeIn(rect, 0, kind === 'ust' ? input.height - t / 2 : t / 2, 0),
});

const backPart = (rect: IModuleRect, input: ICarcassInput): IPart => {
  const back = input.backPanel / 10;

  return {
    kind: 'arkalik',
    partClass: 'panel',
    moduleIndex: rect.index,
    materialRole: 'back',
    label: 'Arkalık',
    qty: 1,
    hidden: true,
    size: { w: rect.outerWidth, h: input.height, d: back },
    grossSize: { w: rect.outerWidth, h: input.height, d: back },
    placement: placeIn(rect, 0, input.height / 2, -input.depth / 2 + back / 2),
  };
};

const doorPartsFor = (
  rect: IModuleRect,
  input: ICarcassInput,
  book: IPriceBook,
  t: number,
  maxLeaf: number,
  module?: ICarcassModule,
): IPart[] => {
  const doorType = book.doorTypes.find((item) => item.id === input.doorType);
  if (!doorType || input.doorType === 'yok') return [];

  const leaves = doorLeafCount(rect.outerWidth, maxLeaf, module?.doorLeaves);
  if (leaves === 0) return [];

  const leafWidth = rect.outerWidth / leaves;
  const parts: IPart[] = [];

  for (let leaf = 0; leaf < leaves; leaf += 1) {
    const localX = -rect.outerWidth / 2 + leafWidth * (leaf + 0.5);

    parts.push({
      kind: 'kapak',
      partClass: 'panel',
      moduleIndex: rect.index,
      materialRole: 'door',
      label: `Kapak — ${doorType.label}`,
      qty: 1,
      size: { w: leafWidth, h: input.height, d: t },
      grossSize: { w: leafWidth, h: input.height, d: t },
      bandedEdgeM: (2 * (leafWidth + input.height)) / 100,
      placement: placeIn(rect, localX, input.height / 2, input.depth / 2 + t / 2),
    });
  }

  const hinges = hingeCountFor(input.height, book.hardware.hinge.countByDoorHeight);

  if (hinges > 0) {
    parts.push({
      kind: 'mentese',
      partClass: 'hardware',
      moduleIndex: rect.index,
      label: 'Menteşeler',
      qty: leaves * hinges,
    });
  }

  if (doorType.includesHandle) {
    parts.push({
      kind: 'kulp',
      partClass: 'hardware',
      moduleIndex: rect.index,
      label: 'Kulplar',
      qty: leaves,
    });
  }

  return parts;
};

export const carcassParts = (
  input: ICarcassInput,
  book: IPriceBook,
  maxDoorLeafWidthCm: number,
): ICarcassParts => {
  const material = book.materials.find((item) => item.id === input.material);
  const t = panelThicknessOf(material?.thicknessMm ?? 18);
  const modules = moduleRects(
    input.modules.map((module) => ({
      bayWidth: module.width,
      corner: module.corner === true,
    })),
    t,
    input.depth,
  );
  const parts: IPart[] = [];

  const doorType = book.doorTypes.find((item) => item.id === input.doorType);
  const hasDoor = !!doorType && input.doorType !== 'yok';

  for (const rect of modules) {
    if (rect.bayWidth <= 0) continue;

    /*
     * Köşe modülü ayrı bir kutu — düz modülün parçalarıyla anlatılamıyor:
     * gövdesi L, iki arkalığı, iki dik cephesi var.
     */
    if (rect.corner) {
      parts.push(
        ...cornerUnitParts(rect, {
          height: input.height,
          depth: input.depth,
          backCm: input.backPanel / 10,
          panelThicknessCm: t,
          doorLabel: hasDoor && doorType ? doorType.label : null,
          includesHandle: doorType?.includesHandle === true,
          hingeCount: hingeCountFor(
            input.height,
            book.hardware.hinge.countByDoorHeight,
          ),
        }),
      );
      continue;
    }

    /* İki yan panel modülün kendi kenarlarında: dış genişliğin yarısı eksi
       yarım panel kalınlığı, yerel eksende. */
    const sideOffset = (rect.outerWidth - t) / 2;

    parts.push(sidePart(rect, -sideOffset, input, t));
    parts.push(sidePart(rect, sideOffset, input, t));
    parts.push(horizontalPart(rect, 'ust', input, t));
    parts.push(horizontalPart(rect, 'alt', input, t));
    parts.push(backPart(rect, input));
    parts.push(
      ...doorPartsFor(rect, input, book, t, maxDoorLeafWidthCm, input.modules[rect.index]),
    );
  }

  return { parts, modules, panelThicknessCm: t };
};
