import { Vector3 } from 'three';

import type { TPartKind } from '@/views/configurator/_etc/pricing/types';
import type { Object3D } from 'three';

/**
 * Montaj çizelgesi: hangi parça kaydırmanın hangi aralığında, nereden gelerek
 * yerine oturuyor. Geometriden ayrı duruyor çünkü burada tek bir Three.js
 * nesnesi kurulmuyor — bu dosya yalnızca zamanlama ve yön söylüyor.
 */

/** Montaj kaydırmanın ilk %85'inde biter; kalan pay dolabı seyretmek için. */
export const ASSEMBLY_SPAN = 0.72;

const MAX_DOOR_ANGLE = (82 * Math.PI) / 180;

/**
 * Montaj bittikten sonraki son beat: ortadaki iki kanat açılıyor.
 * Kapalı bir dolapla bitmek kahverengi bir kutuyla bitmek demekti — işin
 * anlatacağı şey (raf, askılık, çekmece) tam da kapağın arkasında.
 */
export const REVEAL_FROM = 0.9;
const REVEAL_ANGLE = (46 * Math.PI) / 180;

export interface IStagedNode {
  node: Object3D;
  home: Vector3;
  offset: Vector3;
  t0: number;
  t1: number;
  hinge?: 1 | -1;
  /** Yalnızca ortadaki kanatlarda: montaj bitince bu kadar açılıyor. */
  opensAtEnd?: boolean;
}

/**
 * Parçanın nereden uçtuğu imalat sırasını anlatıyor: arkalık en arkadan,
 * yanlar dışarıdan, üst tepeden, çekmeceler öne çekilmiş, kapaklar en son ve
 * açık. Sıra keyfi değil — atölyede kuru kurulum da bu sırayla yapılıyor.
 */
const STAGE: Record<
  TPartKind,
  { t0: number; span: number; offset: [number, number, number] } | null
> = {
  arkalik: { t0: 0, span: 0.26, offset: [0, 0, -0.62] },
  'yan-panel': { t0: 0.1, span: 0.3, offset: [0, 0, 0] },
  alt: { t0: 0.2, span: 0.28, offset: [0, -0.48, 0] },
  ust: { t0: 0.22, span: 0.28, offset: [0, 0.42, 0] },
  raf: { t0: 0.34, span: 0.3, offset: [0, 0.1, -0.46] },
  askilik: { t0: 0.44, span: 0.24, offset: [0, 0.3, 0] },
  cekmece: { t0: 0.5, span: 0.3, offset: [0, 0, 0.42] },
  kapak: { t0: 0.6, span: 0.34, offset: [0, 0, 0.44] },
  kulp: null,
  mentese: null,
};

/** Aynı türden parçalar aynı anda değil, dalga hâlinde yerine oturuyor. */
const STAGGER = 0.022;

export interface IStageWindow {
  t0: number;
  t1: number;
  offset: Vector3;
}

export const windowFor = (
  kind: TPartKind,
  index: number,
): IStageWindow | null => {
  const stage = STAGE[kind];
  if (!stage) return null;

  const t0 = Math.min(stage.t0 + index * STAGGER, 0.94);

  return {
    t0,
    t1: Math.min(t0 + stage.span, 1),
    offset: new Vector3(...stage.offset),
  };
};

/**
 * Yan paneller kendi tarafına açılıyor, gövdenin ortasındakiler daha az:
 * hepsi eşit uzaklığa gitseydi patlatılmış çizim değil dağılmış bir yığın
 * olurdu.
 */
export const sideOffsetX = (x: number): number =>
  (x < 0 ? -1 : 1) * (0.3 + Math.abs(x) * 0.3);

const smoothstep = (x: number): number => {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * (3 - 2 * t);
};

/** Montaj ilerlemesini (0–1) sahneye uygular. Sahne yeniden kurulmaz. */
export const applyAssembly = (
  nodes: IStagedNode[],
  progress: number,
): void => {
  for (const staged of nodes) {
    const span = staged.t1 - staged.t0;
    const local = smoothstep(span > 0 ? (progress - staged.t0) / span : 1);
    const away = 1 - local;

    staged.node.position.set(
      staged.home.x + staged.offset.x * away,
      staged.home.y + staged.offset.y * away,
      staged.home.z + staged.offset.z * away,
    );

    if (!staged.hinge) continue;

    const reveal = staged.opensAtEnd
      ? smoothstep((progress - REVEAL_FROM) / (1 - REVEAL_FROM))
      : 0;

    staged.node.rotation.y =
      staged.hinge * (MAX_DOOR_ANGLE * away + REVEAL_ANGLE * reveal);
  }
};
