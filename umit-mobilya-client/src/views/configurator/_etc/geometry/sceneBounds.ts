import type { IPart } from '../pricing/types';

/**
 * Parça listesinin kapladığı kutu (cm). Kamerayı çerçeveleyen ölçü budur,
 * `config.width` DEĞİL: köşe modülünden sonra sıra dönüyor ve gövde artık tek
 * bir eksende değil. Toplam koşu uzunluğu 450 cm olan L bir dolabın ayak izi
 * 250 x 200 olabilir; kamerayı 450'ye göre çerçevelemek dolabı kadranın
 * ortasında minicik bırakırdı.
 *
 * Ürün BİLMEZ: parçanın kendi ölçüsü ve yeri yeterli. Dönmüş parçanın
 * genişliği dünya x'inde değil kendi ekseninde ölçülü olduğu için burada
 * dönüş uygulanıyor.
 */

const CM = 0.01;

export interface ISceneBounds {
  width: number;
  height: number;
  depth: number;
}

const EMPTY: ISceneBounds = { width: 0, height: 0, depth: 0 };

export const sceneBoundsOf = (parts: IPart[]): ISceneBounds => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let maxY = 0;

  for (const part of parts) {
    const { size, placement } = part;
    if (!size || !placement) continue;

    const turn = placement.rotationY ?? 0;
    const cos = Math.abs(Math.cos(turn));
    const sin = Math.abs(Math.sin(turn));

    const halfX = (size.w / 2) * cos + (size.d / 2) * sin;
    const halfZ = (size.w / 2) * sin + (size.d / 2) * cos;

    const x = placement.x / CM;
    const z = placement.z / CM;

    minX = Math.min(minX, x - halfX);
    maxX = Math.max(maxX, x + halfX);
    minZ = Math.min(minZ, z - halfZ);
    maxZ = Math.max(maxZ, z + halfZ);
    maxY = Math.max(maxY, placement.y / CM + size.h / 2);
  }

  if (!Number.isFinite(minX)) return EMPTY;

  return {
    width: maxX - minX,
    height: maxY,
    depth: maxZ - minZ,
  };
};
