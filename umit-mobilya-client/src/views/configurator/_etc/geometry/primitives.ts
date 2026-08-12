import {
  BoxGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
} from 'three';

import { loadTexture } from './textureCache';

import type { IPriceBook } from '../pricing/priceBook';
import type { TDoorTypeId, TFinishId, TMaterialId } from '../pricing/types';
import type { Material, Texture } from 'three';

/**
 * Her ürün tipinin paylaştığı çizim ilkelleri. Gardırop da vestiyer de mutfak
 * da sonuçta kutudan ibaret; kutuyu ve malzemeyi tek yerden almak, bir ürünün
 * gölge ayarını değiştirdiğinde diğerlerinin de tutarlı kalmasını sağlıyor.
 */

/** Desen ölçeği verilmemişse ceviz damarı için makul bir başlangıç. */
const DEFAULT_TEXTURE_SCALE_CM = 60;

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

/**
 * Kutunun UV'lerini GERÇEK ÖLÇÜSÜNE göre ölçekler.
 *
 * `BoxGeometry` her yüze 0–1 arası UV veriyor, yani paylaşılan bir doku 40
 * cm'lik rafta da 240 cm'lik kapakta da aynı sayıda tekrar ederdi: raf normal
 * görünürken kapaktaki damar dört kat gerilirdi. Burada UV metre cinsine
 * çekiliyor, tekrar sıklığını dokunun `repeat`i belirliyor (`textureCache`).
 *
 * Doku olmasa da uygulanıyor — koşullu yapmak, aynı geometrinin dokulu ve
 * dokusuz iki farklı hâlinin olması demekti.
 */
const applyWorldUv = (
  geometry: BoxGeometry,
  w: number,
  h: number,
  d: number,
): void => {
  const uv = geometry.attributes['uv'];
  if (!uv) return;

  /* BoxGeometry yüz sırası: +X, -X, +Y, -Y, +Z, -Z. */
  const spans: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];

  spans.forEach(([spanU, spanV], face) => {
    for (let corner = 0; corner < 4; corner += 1) {
      const index = face * 4 + corner;
      uv.setXY(index, uv.getX(index) * spanU, uv.getY(index) * spanV);
    }
  });

  uv.needsUpdate = true;
};

export const box = (
  material: Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
): Mesh => {
  const geometry = new BoxGeometry(w, h, d);
  applyWorldUv(geometry, w, h, d);

  const mesh = new Mesh(geometry, material);
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
  onTextureLoad?: () => void,
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

  let disposed = false;

  /**
   * Dokuyu yüzey malzemelerine takar.
   *
   * Taban renk BEYAZA çekiliyor: `map` renkle çarpılıyor, yani ceviz rengi bir
   * kaplamaya ceviz fotoğrafı konduğunda görsel iki kez renklenip çamura
   * dönerdi. Renk, deseni OLMAYAN kaplamanın rengi.
   */
  const applyTexture = (texture: Texture): void => {
    if (disposed) return;

    for (const material of [panel, door, interior]) {
      material.map = texture;
      material.color.set(0xffffff);
      material.needsUpdate = true;
    }

    onTextureLoad?.();
  };

  if (finish.textureUrl) {
    const ready = loadTexture(
      finish.textureUrl,
      finish.textureScaleCm ?? DEFAULT_TEXTURE_SCALE_CM,
      applyTexture,
    );

    /* Önbellekte varsa aynı karede takılıyor; yoksa gelince. */
    if (ready) applyTexture(ready);
  }

  return {
    panel,
    door,
    interior,
    metal,
    dispose: () => {
      /*
       * Bayrak, geç gelen bir dokunun ARTIK KULLANILMAYAN malzemelere
       * yazmasını ve ölü bir sahne için yeniden çizim istemesini engelliyor.
       */
      disposed = true;
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
