import { Object3D } from 'three';

import { box } from './primitives';
import { T } from './units';

import type { ICarcass } from './carcass';
import type { IProductMaterials } from './primitives';
import type { Group } from 'three';

/**
 * Menteşeli ön yüzler. Gövdesi ve bölümü olan her ürün tipinde aynı davranış,
 * o yüzden ürün klasörlerinde değil burada.
 */
export type TDoorHinge = 'left' | 'right';

export interface IDoorPivot {
  pivot: Object3D;
  hinge: TDoorHinge;
}

const MAX_ANGLE = (100 * Math.PI) / 180;
const GAP = 0.003;

export interface IDoorSpec {
  /** Kulp çizilsin mi. */
  hasHandle: boolean;
}

/**
 * Kapaklar bölümlerin kendi genişliğini takip eder, eşit bölünmez: dar bir
 * bölümün önüne geniş kapak koymak gövdeyi yanlış gösterirdi. Uçtaki kapaklar
 * gövde kenarına, aradakiler bölme ortasına kadar uzanır.
 *
 * Menteşe yönü dışa doğru: soldaki yarı sola, sağdaki yarı sağa açılır.
 */
export const buildDoors = (
  group: Group,
  materials: IProductMaterials,
  carcass: ICarcass,
  spec: IDoorSpec,
): IDoorPivot[] => {
  const { layout, W, H, D } = carcass;
  const pivots: IDoorPivot[] = [];
  const doorHeight = H - 0.01;

  for (let i = 0; i < layout.length; i += 1) {
    const leftEdge = i === 0 ? -W / 2 : layout[i - 1].end + T / 2;
    const rightEdge = i === layout.length - 1 ? W / 2 : layout[i].end + T / 2;
    const doorWidth = rightEdge - leftEdge;
    if (doorWidth <= 0) continue;

    const hinge: TDoorHinge = i < layout.length / 2 ? 'left' : 'right';
    const hingeX = hinge === 'left' ? leftEdge : rightEdge;

    const pivot = new Object3D();
    pivot.position.set(hingeX, H / 2, D / 2 + GAP);

    const offset = hinge === 'left' ? doorWidth / 2 : -doorWidth / 2;
    pivot.add(
      box(materials.panel, doorWidth - GAP * 2, doorHeight, T, offset, 0, T / 2),
    );

    if (spec.hasHandle) {
      const handleX =
        hinge === 'left'
          ? offset + doorWidth / 2 - 0.05
          : offset - doorWidth / 2 + 0.05;
      pivot.add(box(materials.metal, 0.016, 0.16, 0.022, handleX, 0, T + 0.011));
    }

    group.add(pivot);
    pivots.push({ pivot, hinge });
  }

  return pivots;
};

/**
 * Kapak açısı sahneyi yeniden kurmadan güncellenir: kaydırıcı sürüklenirken
 * saniyede onlarca kez yeniden inşa etmek gereksiz, tek yapılan bir rotasyon.
 */
export const applyDoorOpen = (pivots: IDoorPivot[], amount: number): void => {
  const angle = MAX_ANGLE * Math.min(Math.max(amount, 0), 1);
  for (const { pivot, hinge } of pivots) {
    pivot.rotation.y = hinge === 'left' ? -angle : angle;
  }
};
