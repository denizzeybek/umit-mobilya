import { CylinderGeometry, Group, Mesh } from 'three';

import { addDoors, addHandles, applyDoorOpen } from './doorPivots';
import { box, createMaterials, disposeGeometries } from './primitives';

import type { IPriceBook } from '../pricing/priceBook';
import type { IPart } from '../pricing/types';
import type { IBaseConfig, IProductBuild } from '../types';
import type { IProductMaterials } from './primitives';
import type { Object3D } from 'three';

/**
 * Parça listesini sahneye çevirir. Bu dosya ürün BİLMEZ ve geometri kararı
 * VERMEZ: hangi parçanın nerede olduğu `partsOf` çıktısında yazıyor, burası
 * yalnızca onu mesh'e çeviriyor.
 *
 * Ayrımın sebebi: fiyat da aynı listeyi okuyor. Buraya bir kutu eklemek
 * fiyata görünmeyen bir parça eklemek olurdu ve ekranla fiyat ayrışırdı.
 *
 * Kapaklar `doorPivots.ts`te: onlar mesh değil mekanizma, ve açı sahne
 * yeniden kurulmadan güncelleniyor. Çağıranlar `applyDoorOpen`u buradan
 * almaya devam ediyor.
 */

export { applyDoorOpen };

const CM = 0.01;
const RAIL_RADIUS = 0.014;
const DRAWER_GAP = 0.003;

export interface IProductBuildInput {
  config: IBaseConfig;
  parts: IPart[];
  book: IPriceBook;
  /**
   * Kaplama deseni ağdan geldiğinde çağrılır. Sahne kurulumu senkron; desen
   * ilk kez yüklenirken panel düz renk çiziliyor ve görsel geldiğinde bir kare
   * daha isteniyor. Bu olmadan desen ancak kullanıcı başka bir şeye
   * dokunduğunda beliriyordu.
   */
  onTextureLoad?: () => void;
}

const meshFor = (
  part: IPart,
  materials: IProductMaterials,
): Object3D | null => {
  const { size, placement } = part;
  if (!size || !placement) return null;

  const turn = placement.rotationY ?? 0;

  if (part.kind === 'askilik') {
    /*
     * Boru kendi ekseninde zaten çevrili; modülün dönüşü onun ÜSTÜNE gelirse
     * Euler sırası ikisini karıştırıyor. Grup, iki dönüşü ayrı tutmanın en
     * kısa yolu.
     */
    const rail = new Mesh(
      new CylinderGeometry(RAIL_RADIUS, RAIL_RADIUS, size.w * CM, 12),
      materials.metal,
    );
    rail.rotation.z = Math.PI / 2;
    rail.castShadow = true;

    const holder = new Group();
    holder.add(rail);
    holder.position.set(placement.x, placement.y, placement.z);
    holder.rotation.y = turn;
    return holder;
  }

  /*
   * Çekmece TEK parça ama İKİ kutu: ön panel ve üstündeki metal kulp çıtası.
   * İkisi de aynı fiziksel şeyin parçası (birim fiyatı ikisini de içeriyor),
   * o yüzden parça listesine ayrı satır girmiyorlar — sahnede bir grup
   * oluyorlar. Kulp çizilmediğinde çekmeceler düz panel gibi görünüyordu.
   */
  if (part.kind === 'cekmece') {
    const group = new Group();
    const w = size.w * CM;
    const h = size.h * CM;
    const d = size.d * CM;

    group.add(box(materials.panel, w - DRAWER_GAP * 2, h - DRAWER_GAP * 2, d, 0, 0, 0));
    group.add(
      box(
        materials.metal,
        w * 0.42,
        0.008,
        0.012,
        0,
        h / 2 - 0.03,
        d / 2 + 0.006,
      ),
    );

    group.position.set(placement.x, placement.y, placement.z);
    group.rotation.y = turn;
    return group;
  }

  const material =
    part.materialRole === 'back' ? materials.interior : materials.panel;

  const mesh = box(
    material,
    size.w * CM,
    size.h * CM,
    size.d * CM,
    placement.x,
    placement.y,
    placement.z,
  );
  mesh.rotation.y = turn;

  return mesh;
};

export const buildFromParts = (input: IProductBuildInput): IProductBuild => {
  const { config, parts, book } = input;
  const group = new Group();
  const materials = createMaterials(
    config.finish,
    config.material,
    book,
    config.doorType,
    input.onTextureLoad,
  );

  const doors = parts.filter((part) => part.kind === 'kapak');

  for (const part of parts) {
    if (part.kind === 'kapak' || part.kind === 'kulp' || part.kind === 'mentese') {
      continue;
    }
    const mesh = meshFor(part, materials);
    if (mesh) group.add(mesh);
  }

  const doorPivots = addDoors(group, doors, materials);

  const doorType = book.doorTypes.find((item) => item.id === config.doorType);
  if (doorType?.render.hasHandle) {
    addHandles(doors, doorPivots, materials);
  }

  return {
    group,
    doorPivots,
    dispose: () => {
      disposeGeometries(group);
      materials.dispose();
    },
  };
};
