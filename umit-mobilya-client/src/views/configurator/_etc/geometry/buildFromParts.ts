import { CylinderGeometry, Group, Mesh, Object3D } from 'three';

import { box, createMaterials, disposeGeometries } from './primitives';

import type { IPriceBook } from '../pricing/priceBook';
import type { IPart } from '../pricing/types';
import type { IBaseConfig, IProductBuild } from '../types';
import type { IProductMaterials } from './primitives';

/**
 * Parça listesini sahneye çevirir. Bu dosya ürün BİLMEZ ve geometri kararı
 * VERMEZ: hangi parçanın nerede olduğu `partsOf` çıktısında yazıyor, burası
 * yalnızca onu mesh'e çeviriyor.
 *
 * Ayrımın sebebi: fiyat da aynı listeyi okuyor. Buraya bir kutu eklemek
 * fiyata görünmeyen bir parça eklemek olurdu ve ekranla fiyat ayrışırdı.
 */

const CM = 0.01;
const DOOR_GAP = 0.003;
const RAIL_RADIUS = 0.014;
const DRAWER_GAP = 0.003;
const MAX_DOOR_ANGLE = (100 * Math.PI) / 180;

/**
 * Kapak açısı sahneyi yeniden kurmadan güncellenir: kaydırıcı sürüklenirken
 * saniyede onlarca kez yeniden inşa etmek gereksiz, tek yapılan bir rotasyon.
 */
export const applyDoorOpen = (
  pivots: IProductBuild['doorPivots'],
  amount: number,
): void => {
  const angle = MAX_DOOR_ANGLE * Math.min(Math.max(amount, 0), 1);

  for (const { pivot, hinge } of pivots) {
    pivot.rotation.y = hinge === 'left' ? -angle : angle;
  }
};

export interface IProductBuildInput {
  config: IBaseConfig;
  parts: IPart[];
  book: IPriceBook;
}

const meshFor = (
  part: IPart,
  materials: IProductMaterials,
): Object3D | null => {
  const { size, placement } = part;
  if (!size || !placement) return null;

  if (part.kind === 'askilik') {
    const rail = new Mesh(
      new CylinderGeometry(RAIL_RADIUS, RAIL_RADIUS, size.w * CM, 12),
      materials.metal,
    );
    rail.rotation.z = Math.PI / 2;
    rail.position.set(placement.x, placement.y, placement.z);
    rail.castShadow = true;
    return rail;
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
    return group;
  }

  const material =
    part.materialRole === 'back' ? materials.interior : materials.panel;

  return box(
    material,
    size.w * CM,
    size.h * CM,
    size.d * CM,
    placement.x,
    placement.y,
    placement.z,
  );
};

/**
 * Kapaklar pivota bağlanıyor ki açı, sahne yeniden kurulmadan
 * güncellenebilsin. Menteşe yönü cepheye göre: soldaki yarı sola, sağdaki
 * yarı sağa açılır — modül sınırına göre değil, çünkü kullanıcı modülleri
 * değil kanat dizisini görüyor.
 */
const addDoors = (
  group: Group,
  doors: IPart[],
  materials: IProductMaterials,
): IProductBuild['doorPivots'] => {
  const pivots: IProductBuild['doorPivots'] = [];

  doors.forEach((part, index) => {
    const { size, placement } = part;
    if (!size || !placement) return;

    const hinge = index < doors.length / 2 ? 'left' : 'right';
    const halfWidth = (size.w * CM) / 2;
    const hingeX = placement.x + (hinge === 'left' ? -halfWidth : halfWidth);

    const pivot = new Object3D();
    pivot.position.set(hingeX, placement.y, placement.z);

    pivot.add(
      box(
        materials.door,
        size.w * CM - DOOR_GAP * 2,
        size.h * CM - 0.01,
        size.d * CM,
        hinge === 'left' ? halfWidth : -halfWidth,
        0,
        0,
      ),
    );

    group.add(pivot);
    pivots.push({ pivot, hinge });
  });

  return pivots;
};

/**
 * Kulp menteşenin KARŞI kenarında durur. Pivot menteşede olduğu için kapağın
 * serbest kenarı `2 x yarımGenişlik` uzakta; kulp oradan 5 cm içeride.
 */
const addHandles = (
  doors: IPart[],
  pivots: IProductBuild['doorPivots'],
  materials: IProductMaterials,
): void => {
  doors.forEach((part, index) => {
    const pivot = pivots[index]?.pivot;
    const { size } = part;
    if (!pivot || !size) return;

    const width = size.w * CM;
    const sign = pivots[index].hinge === 'left' ? 1 : -1;

    pivot.add(
      box(
        materials.metal,
        0.016,
        0.16,
        0.022,
        sign * (width - 0.05),
        0,
        size.d * CM + 0.011,
      ),
    );
  });
};

export const buildFromParts = (input: IProductBuildInput): IProductBuild => {
  const { config, parts, book } = input;
  const group = new Group();
  const materials = createMaterials(
    config.finish,
    config.material,
    book,
    config.doorType,
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
