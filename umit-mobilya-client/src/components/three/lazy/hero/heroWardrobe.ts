import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';

import { box } from '@/views/configurator/_etc/geometry/primitives';

import { sideOffsetX, windowFor } from './heroAssembly';

import type { IStagedNode } from './heroAssembly';
import type { IPart, TPartKind } from '@/views/configurator/_etc/pricing/types';
import type { Material } from 'three';

/**
 * Ana sayfadaki gardırobu parça parça kurar. Parça listesi UYDURULMUYOR —
 * `gardiropParts` ne veriyorsa o çiziliyor, yani ekrandaki dolap
 * konfigüratördeki ve fiyatı hesaplanan dolapla aynı liste.
 *
 * Konfigüratörün `buildFromParts`ı bu iş için kullanılamıyor: o tek bir grup
 * döndürüyor ve parça kimliğini kaybediyor, burada ise her parçanın ayrı ayrı
 * hareket etmesi gerekiyor. Malzemeler de kasten ayrı — sahne karanlık ve
 * kaplama dokuları ağdan geliyor; ana sayfanın ilk karesi bir istek beklemesin.
 */

const CM = 0.01;
const DOOR_GAP = 0.003;
const DRAWER_GAP = 0.003;
const RAIL_RADIUS = 0.014;

export interface IHeroBuild {
  group: Group;
  nodes: IStagedNode[];
  dispose: () => void;
}

interface IHeroMaterials {
  panel: MeshStandardMaterial;
  door: MeshStandardMaterial;
  interior: MeshStandardMaterial;
  metal: MeshStandardMaterial;
}

const createMaterials = (): IHeroMaterials => ({
  panel: new MeshStandardMaterial({
    color: 0xa98a63,
    roughness: 0.64,
    metalness: 0.04,
  }),
  door: new MeshStandardMaterial({
    color: 0x9a7a53,
    roughness: 0.48,
    metalness: 0.06,
  }),
  interior: new MeshStandardMaterial({
    color: 0x3a3127,
    roughness: 0.96,
    metalness: 0,
  }),
  metal: new MeshStandardMaterial({
    color: 0xc9a76b,
    roughness: 0.3,
    metalness: 0.9,
  }),
});

const drawerNode = (part: IPart, materials: IHeroMaterials): Object3D => {
  const { size } = part;
  if (!size) return new Group();

  const group = new Group();
  const w = size.w * CM;
  const h = size.h * CM;
  const d = size.d * CM;

  group.add(
    box(materials.panel, w - DRAWER_GAP * 2, h - DRAWER_GAP * 2, d, 0, 0, 0),
  );
  group.add(
    box(materials.metal, w * 0.42, 0.008, 0.012, 0, h / 2 - 0.03, d / 2 + 0.006),
  );

  return group;
};

const railNode = (part: IPart, materials: IHeroMaterials): Object3D => {
  const rail = new Mesh(
    new CylinderGeometry(RAIL_RADIUS, RAIL_RADIUS, (part.size?.w ?? 0) * CM, 12),
    materials.metal,
  );
  rail.rotation.z = Math.PI / 2;
  rail.castShadow = true;

  return rail;
};

/**
 * Kapak menteşesine bağlı bir pivot olarak kuruluyor ki hem yerine kayabilsin
 * hem de kapanabilsin; ikisi aynı düğümün iki ayrı ekseni.
 */
const doorNode = (
  part: IPart,
  hinge: 1 | -1,
  materials: IHeroMaterials,
): { node: Object3D; home: Vector3 } | null => {
  const { size, placement } = part;
  if (!size || !placement) return null;

  const halfWidth = (size.w * CM) / 2;
  const towardHinge = hinge === -1 ? -halfWidth : halfWidth;

  const pivot = new Object3D();
  pivot.add(
    box(
      materials.door,
      size.w * CM - DOOR_GAP * 2,
      size.h * CM - 0.01,
      size.d * CM,
      -towardHinge,
      0,
      0,
    ),
  );

  /* Kulp menteşenin KARŞI kenarında, serbest kenardan 5 cm içeride. */
  pivot.add(
    box(
      materials.metal,
      0.016,
      0.16,
      0.022,
      -hinge * (size.w * CM - 0.05),
      0,
      size.d * CM + 0.011,
    ),
  );

  return {
    node: pivot,
    home: new Vector3(placement.x + towardHinge, placement.y, placement.z),
  };
};

export const buildHeroWardrobe = (parts: IPart[]): IHeroBuild => {
  const materials = createMaterials();
  const group = new Group();
  const nodes: IStagedNode[] = [];
  const seen = new Map<TPartKind, number>();

  const doorCount = parts.filter((part) => part.kind === 'kapak').length;

  for (const part of parts) {
    const { size, placement } = part;
    if (!size || !placement) continue;

    const index = seen.get(part.kind) ?? 0;
    seen.set(part.kind, index + 1);

    const stage = windowFor(part.kind, index);
    if (!stage) continue;

    if (part.kind === 'kapak') {
      const hinge = index < doorCount / 2 ? -1 : 1;
      const door = doorNode(part, hinge, materials);
      if (!door) continue;

      group.add(door.node);
      nodes.push({
        ...stage,
        node: door.node,
        home: door.home,
        hinge,
        /*
         * YALNIZCA ortanın solundaki kanat açılıyor. Sağdaki kanat kameraya
         * doğru açılıyor ve açıldığında gövdenin tamamını kapatıyordu; soldaki
         * ise kameradan uzağa açılıp iç düzeni ortaya çıkarıyor.
         */
        opensAtEnd: index === Math.ceil(doorCount / 2) - 1,
      });
      continue;
    }

    let node: Object3D;

    if (part.kind === 'cekmece') {
      node = drawerNode(part, materials);
    } else if (part.kind === 'askilik') {
      node = railNode(part, materials);
    } else {
      const material: Material =
        part.materialRole === 'back' ? materials.interior : materials.panel;
      node = box(material, size.w * CM, size.h * CM, size.d * CM, 0, 0, 0);
    }

    group.add(node);
    nodes.push({
      ...stage,
      node,
      offset:
        part.kind === 'yan-panel'
          ? new Vector3(sideOffsetX(placement.x), 0, 0)
          : stage.offset,
      home: new Vector3(placement.x, placement.y, placement.z),
    });
  }

  return {
    group,
    nodes,
    dispose: () => {
      group.traverse((child) => {
        if (child instanceof Mesh) child.geometry.dispose();
      });
      Object.values(materials).forEach((material) => material.dispose());
    },
  };
};
