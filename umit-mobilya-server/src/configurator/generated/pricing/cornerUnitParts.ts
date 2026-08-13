/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
import { cornerSideOf, placeIn } from './moduleLayout';

import type { IModuleRect } from './moduleLayout';
import type { IPart } from './types';

/**
 * Köşe modülü — atölyedeki adıyla L dolap. Düz bir modülün döndürülmüş hâli
 * DEĞİL, kendi gövdesi olan ayrı bir kutu:
 *
 *   ┌───────────────┐   kenar S = cephe F + derinlik D
 *   │               │   iki bacak da D derinliğinde
 *   │        ┌──────┤   ön iç köşeden F karesi çıkarılmış
 *   │        │      │   geriye kalan iki iç yüz = cephe, her biri F
 *   └────────┴──────┘
 *
 * **Cephe, modülün kendi genişliğidir.** Yani köşe modülü iki normal modülün
 * dik birleşmiş hâli gibi görünür: her bacak bir modül yüzü kadar cephe verir,
 * ortadaki kare ikisinin paylaştığı köşedir. Kapak da bu yüzden iki kanat —
 * her yüze bir kanat, ve kanatlar birbirine menteşeli (bi-fold): biri gövdeye,
 * biri diğerine, yani iki takım menteşe.
 *
 * İki komşu sıra iki DIŞ kenarına dayanır.
 *
 * Ölçüler modülün KENDİ çerçevesinde: yerel +x sıranın yönü, yerel +z cephe.
 * Kare ayak izinin merkezi yerel (0, 0); duvarlar -z ve +x tarafında.
 */

export interface ICornerUnitInput {
  height: number;
  depth: number;
  /** Arkalık kalınlığı (mm değil CM: çağıran çeviriyor). */
  backCm: number;
  panelThicknessCm: number;
  /** Kapak yoksa `null` — o zaman kanat da menteşe de üretilmiyor. */
  doorLabel: string | null;
  includesHandle: boolean;
  /** Tek takım menteşe adedi; köşe kapağı bunun İKİ katını alıyor. */
  hingeCount: number;
}

const panel = (
  rect: IModuleRect,
  kind: IPart['kind'],
  label: string,
  size: { w: number; h: number; d: number },
  at: { x: number; y: number; z: number },
): IPart => ({
  kind,
  partClass: 'panel',
  moduleIndex: rect.index,
  materialRole: 'carcass',
  label,
  qty: 1,
  size,
  grossSize: size,
  placement: placeIn(rect, at.x, at.y, at.z),
});

/** L tabanın iki dikdörtgeni: bacak A tam kenar, bacak B kalan cephe kadar. */
const horizontalParts = (
  rect: IModuleRect,
  input: ICornerUnitInput,
  kind: 'ust' | 'alt',
  y: number,
): IPart[] => {
  const side = cornerSideOf(rect.outerWidth, input.depth);
  const { depth, panelThicknessCm: t } = input;
  const face = side - depth;

  const parts = [
    panel(rect, kind, 'Gövde', { w: side, h: t, d: depth }, {
      x: 0,
      y,
      z: -side / 2 + depth / 2,
    }),
  ];

  if (face > 0) {
    parts.push(
      panel(rect, kind, 'Gövde', { w: depth, h: t, d: face }, {
        x: side / 2 - depth / 2,
        y,
        z: -side / 2 + depth + face / 2,
      }),
    );
  }

  return parts;
};

const doorParts = (rect: IModuleRect, input: ICornerUnitInput): IPart[] => {
  const { doorLabel, height, depth, panelThicknessCm: t } = input;
  const side = cornerSideOf(rect.outerWidth, input.depth);
  const face = side - depth;

  if (doorLabel === null || face <= 0) return [];

  const leaf = (
    localX: number,
    localZ: number,
    quarterTurns: number,
    fold: boolean,
  ): IPart => ({
    kind: 'kapak',
    partClass: 'panel',
    moduleIndex: rect.index,
    materialRole: 'door',
    label: `Kapak — ${doorLabel}`,
    qty: 1,
    size: { w: face, h: height, d: t },
    grossSize: { w: face, h: height, d: t },
    bandedEdgeM: (2 * (face + height)) / 100,
    placement: placeIn(rect, localX, height / 2, localZ, quarterTurns),
    doorFold: fold,
  });

  /*
   * Birinci kanat sıranın cephesinde, ikincisi ona dik duran ikinci cephede.
   * KAPALIYKEN aralarında dik açı var — katlanır kapağın imalat çizimindeki
   * hâli bu; açılırken ikincisi birincinin üstüne katlanıyor.
   */
  return [
    leaf(-side / 2 + face / 2, -side / 2 + depth + t / 2, 0, false),
    leaf(side / 2 - depth - t / 2, depth / 2, 1, true),
  ];
};

export const cornerUnitParts = (
  rect: IModuleRect,
  input: ICornerUnitInput,
): IPart[] => {
  const side = cornerSideOf(rect.outerWidth, input.depth);
  const { height, depth, backCm, panelThicknessCm: t } = input;
  const parts: IPart[] = [];

  /* İki yan: biri gelen sıranın, biri devam eden sıranın dayandığı kenar. */
  parts.push(
    panel(rect, 'yan-panel', 'Gövde', { w: t, h: height, d: depth }, {
      x: -side / 2 + t / 2,
      y: height / 2,
      z: -side / 2 + depth / 2,
    }),
    panel(rect, 'yan-panel', 'Gövde', { w: depth, h: height, d: t }, {
      x: side / 2 - depth / 2,
      y: height / 2,
      z: side / 2 - t / 2,
    }),
  );

  parts.push(
    ...horizontalParts(rect, input, 'ust', height - t / 2),
    ...horizontalParts(rect, input, 'alt', t / 2),
  );

  /* İki arkalık: her bacak kendi duvarına dayanıyor. */
  const back = (size: { w: number; h: number; d: number }, at: { x: number; z: number }): IPart => ({
    kind: 'arkalik',
    partClass: 'panel',
    moduleIndex: rect.index,
    materialRole: 'back',
    label: 'Arkalık',
    qty: 1,
    hidden: true,
    size,
    grossSize: size,
    placement: placeIn(rect, at.x, height / 2, at.z),
  });

  parts.push(
    back({ w: side, h: height, d: backCm }, { x: 0, z: -side / 2 + backCm / 2 }),
    back({ w: backCm, h: height, d: side }, { x: side / 2 - backCm / 2, z: 0 }),
  );

  const doors = doorParts(rect, input);
  parts.push(...doors);

  if (doors.length > 0 && input.hingeCount > 0) {
    parts.push({
      kind: 'mentese',
      partClass: 'hardware',
      moduleIndex: rect.index,
      label: 'Menteşeler',
      /* İki takım: biri kanadı gövdeye, biri iki kanadı birbirine bağlıyor. */
      qty: input.hingeCount * 2,
    });
  }

  if (doors.length > 0 && input.includesHandle) {
    parts.push({
      kind: 'kulp',
      partClass: 'hardware',
      moduleIndex: rect.index,
      label: 'Kulplar',
      qty: 1,
    });
  }

  return parts;
};
