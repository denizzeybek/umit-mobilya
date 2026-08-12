import {
  BoxGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
} from 'three';

import { FINISHES, MATERIALS } from '../catalog';

import type { TFinishId, TMaterialId } from '../types';
import type { Material } from 'three';

/**
 * Her ürün tipinin paylaştığı çizim ilkelleri. Gardırop da vestiyer de mutfak
 * da sonuçta kutudan ibaret; kutuyu ve malzemeyi tek yerden almak, bir ürünün
 * gölge ayarını değiştirdiğinde diğerlerinin de tutarlı kalmasını sağlıyor.
 */
export interface IProductMaterials {
  /** Görünen yüzeyler: gövde, kapak, raf. */
  panel: MeshPhysicalMaterial;
  /** Arkalık gibi ışık almayan yüzeyler — biraz daha mat. */
  interior: MeshStandardMaterial;
  /** Kulp, askı borusu, çekmece rayı. */
  metal: MeshStandardMaterial;
  dispose: () => void;
}

export const box = (
  material: Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
): Mesh => {
  const mesh = new Mesh(new BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

export const createMaterials = (
  finishId: TFinishId,
  materialId: TMaterialId,
): IProductMaterials => {
  const finish = FINISHES.find((item) => item.id === finishId) ?? FINISHES[0];
  const spec = MATERIALS.find((item) => item.id === materialId) ?? MATERIALS[0];

  const panel = new MeshPhysicalMaterial({
    color: finish.color,
    roughness: spec.roughness,
    clearcoat: spec.clearcoat,
    clearcoatRoughness: 0.25,
    metalness: 0,
  });

  const interior = new MeshStandardMaterial({
    color: finish.color,
    roughness: Math.min(spec.roughness + 0.2, 1),
  });

  const metal = new MeshStandardMaterial({
    color: 0x2b2b2d,
    roughness: 0.35,
    metalness: 0.85,
  });

  return {
    panel,
    interior,
    metal,
    dispose: () => {
      panel.dispose();
      interior.dispose();
      metal.dispose();
    },
  };
};

/**
 * Grup içindeki her geometriyi serbest bırakır. Malzemeler paylaşıldığı için
 * ayrı — onları `IProductMaterials.dispose` kapatır.
 */
export const disposeGeometries = (root: { traverse: (fn: (child: unknown) => void) => void }): void => {
  root.traverse((child) => {
    if (child instanceof Mesh) child.geometry.dispose();
  });
};
