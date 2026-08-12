import {
  BoxGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
} from 'three';

import type { IPriceBook } from '../pricing/priceBook';
import type { TDoorTypeId, TFinishId, TMaterialId } from '../pricing/types';
import type { Material } from 'three';

/**
 * Her ürün tipinin paylaştığı çizim ilkelleri. Gardırop da vestiyer de mutfak
 * da sonuçta kutudan ibaret; kutuyu ve malzemeyi tek yerden almak, bir ürünün
 * gölge ayarını değiştirdiğinde diğerlerinin de tutarlı kalmasını sağlıyor.
 */
export interface IProductMaterials {
  /** Görünen gövde yüzeyleri: yan, üst, alt, raf. */
  panel: MeshPhysicalMaterial;
  /** Kapak yüzeyi — aynalı ve cam kapak burada ayrışıyor. */
  door: MeshPhysicalMaterial;
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

/**
 * Görünüm de fiyat da aynı seçimden türüyor, o yüzden ikisi de fiyat
 * kitabından okunuyor: `roughness`/`clearcoat` malzemenin, saydamlık ve
 * metaliklik kapak tipinin özelliği.
 *
 * Burada sessiz düşüş KABUL EDİLİR (fiyatın aksine): bilinmeyen bir kimlik
 * yüzünden sahnenin hiç çizilmemesi, biraz yanlış parlayan bir yüzeyden kötü.
 * Kimlik doğrulaması `sanitizeConfig` ve `priceOf` tarafında yapılıyor.
 */
export const createMaterials = (
  finishId: TFinishId,
  materialId: TMaterialId,
  book: IPriceBook,
  doorTypeId?: TDoorTypeId,
): IProductMaterials => {
  const finish =
    book.finishes.find((item) => item.id === finishId) ?? book.finishes[0];
  const spec =
    book.materials.find((item) => item.id === materialId) ?? book.materials[0];
  const doorType = book.doorTypes.find((item) => item.id === doorTypeId);

  const panel = new MeshPhysicalMaterial({
    color: finish.color,
    roughness: spec.roughness,
    clearcoat: spec.clearcoat,
    clearcoatRoughness: 0.25,
    metalness: 0,
  });

  const door = new MeshPhysicalMaterial({
    color: finish.color,
    roughness: doorType?.render.roughness ?? spec.roughness,
    clearcoat: spec.clearcoat,
    clearcoatRoughness: 0.25,
    metalness: doorType?.render.metalness ?? 0,
    transparent: doorType?.render.transparent ?? false,
    opacity: doorType?.render.opacity ?? 1,
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
    door,
    interior,
    metal,
    dispose: () => {
      panel.dispose();
      door.dispose();
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
