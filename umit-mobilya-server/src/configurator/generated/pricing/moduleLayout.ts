/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
import type { IPartPlacement } from './types';

/**
 * Atölye 3 bölümlü bir gardırobu 3 AYRI KUTU olarak imal eder: her modülün
 * kendi iki yanı, kendi üstü, kendi altı vardır. Bu bir tercih değil, fiziksel
 * zorunluluk — 300 cm'lik tek parça üst panel kesilemez.
 *
 * Eski model tek kabuk + (n-1) bölme çiziyordu ve %27 daha az panel
 * sayıyordu. Ekranda görünen dolapla fiyatı hesaplanan dolap ayrışmasın diye
 * yerleşim de fiyat da artık buradan çıkıyor.
 *
 * Sıra düz olmak zorunda değil: köşe modülünden SONRAKİ modüller 90° dönüp
 * komşu duvara oturur. Bu yüzden bir modülün yeri tek bir `x` değil, planda
 * bir çerçeve — konum artı çeyrek dönüş sayısı.
 */

const CM = 0.01;

/** Çeyrek dönüş; eksi, çünkü sıra saat yönünde (sağa) dönüyor. */
const QUARTER_TURN = -Math.PI / 2;

interface IPlanVector {
  x: number;
  z: number;
}

/** Modülün genişlik ekseni ve cephesinin baktığı yön. */
interface IModuleFrame {
  axis: IPlanVector;
  normal: IPlanVector;
}

/**
 * Dönüş sayısına göre eksenler. Trigonometri değil sabit, çünkü
 * `Math.cos(-Math.PI / 2)` sıfır değil 6.1e-17: kayan nokta artığı yerleşimi
 * milimetrenin milyonda biri kaydırır ve testleri okunmaz hâle getirir.
 *
 * Dizi değil dallar: dizi indeksleme sunucunun sıkı derleyicisinde
 * `undefined` üretiyor ve dönüşü hiç ilgilendirmeyen bir korumaya zorluyor.
 */
const frameOf = (turns: number): IModuleFrame => {
  const turn = ((turns % 4) + 4) % 4;

  if (turn === 1) return { axis: { x: 0, z: 1 }, normal: { x: -1, z: 0 } };
  if (turn === 2) return { axis: { x: -1, z: 0 }, normal: { x: 0, z: -1 } };
  if (turn === 3) return { axis: { x: 0, z: -1 }, normal: { x: 1, z: 0 } };

  return { axis: { x: 1, z: 0 }, normal: { x: 0, z: 1 } };
};

/** Bir modülün cm cinsinden yeri; x ekseni soldan sağa, 0 ayak izinin ortası. */
export interface IModuleRect {
  index: number;
  /** Dış genişlik: bölüm genişliği + iki yan panel. */
  outerWidth: number;
  /** İç net genişlik — kullanıcının panele girdiği ölçü. */
  bayWidth: number;
  centerX: number;
  centerZ: number;
  /** Modülün kaç çeyrek dönüş döndüğü (0–3). Düz sırada 0. */
  turns: number;
  /**
   * Köşe modülü: ayak izi `outerWidth` kenarlı KARE, gövdesi ise o karenin
   * ön iç köşesinden bir `(kenar − derinlik)` karesi çıkarılmış L.
   *
   * İki bacağı iki duvara oturur, iki komşu sıra iki dış kenarına dayanır,
   * geriye kalan iki iç yüz de kapağın açıldığı cephedir.
   */
  corner: boolean;
}

export interface IModuleInput {
  bayWidth: number;
  /** Sıra bu modülden SONRA 90° döner — köşe modülü. */
  corner?: boolean;
}

export interface IRunBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const panelThicknessOf = (thicknessMm: number): number =>
  thicknessMm / 10;

/**
 * Köşe modülünün kare ayak izinin kenarı: bir modül YÜZÜ artı derinlik.
 *
 * Cephe modülün kendi genişliği olduğu için köşe modülü iki normal modülün
 * dik birleşmiş hâli gibi duruyor; sırada fazladan kapladığı `derinlik` de
 * ikinci bacağın kendisi, yani duvarın dönüşü.
 */
export const cornerSideOf = (outerWidth: number, depthCm: number): number =>
  outerWidth + depthCm;

/** Bütün modülleri çevreleyen dikdörtgen (cm). Eksenler hep eksene paralel. */
export const boundsOf = (
  rects: IModuleRect[],
  depthCm: number,
): IRunBounds => {
  const bounds: IRunBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
  if (!rects.length) return bounds;

  const spans = rects.map((rect) => {
    const { axis, normal } = frameOf(rect.turns);

    /* Köşe modülünün ayak izi kare: dönüşü ne olursa olsun iki eksende de
       kendi kenarı kadar yer kaplıyor. */
    const side = cornerSideOf(rect.outerWidth, depthCm);
    const halfX = rect.corner
      ? side / 2
      : Math.abs(axis.x) * (rect.outerWidth / 2) +
        Math.abs(normal.x) * (depthCm / 2);
    const halfZ = rect.corner
      ? side / 2
      : Math.abs(axis.z) * (rect.outerWidth / 2) +
        Math.abs(normal.z) * (depthCm / 2);

    return { halfX, halfZ, rect };
  });

  bounds.minX = Math.min(...spans.map((s) => s.rect.centerX - s.halfX));
  bounds.maxX = Math.max(...spans.map((s) => s.rect.centerX + s.halfX));
  bounds.minZ = Math.min(...spans.map((s) => s.rect.centerZ - s.halfZ));
  bounds.maxZ = Math.max(...spans.map((s) => s.rect.centerZ + s.halfZ));

  return bounds;
};

/**
 * Modülleri sırayla yerleştirir ve sonunda tamamını ayak izinin ortasına
 * taşır. Ortalamak sahnenin ve kameranın tek varsayımı: düz bir sırada bu
 * `-toplam / 2`den başlamakla aynı sonucu verir, L sırada ise gövdeyi
 * kadraja oturtan şey olur.
 */
export const moduleRects = (
  modules: IModuleInput[],
  panelThicknessCm: number,
  depthCm = 0,
): IModuleRect[] => {
  const rects: IModuleRect[] = [];
  let turns = 0;
  let x = 0;
  let z = 0;

  modules.forEach((module, index) => {
    const outerWidth = module.bayWidth + 2 * panelThicknessCm;
    const { axis, normal } = frameOf(turns);
    const corner = module.corner === true;

    /*
     * Köşe modülü sırada KENDİ genişliğinden fazla yer kaplıyor: cephesi bir
     * modül yüzü kadar ama arkasında bir de ikinci bacağın karesi var. İki
     * eksende de `genişlik + derinlik`, yani ayak izi kare — ve merkezi
     * sıranın ekseninden yarım taşma kadar ileride.
     */
    const side = corner ? cornerSideOf(outerWidth, depthCm) : outerWidth;
    const overhang = corner ? (side - depthCm) / 2 : 0;

    rects.push({
      index,
      outerWidth,
      bayWidth: module.bayWidth,
      centerX: x + axis.x * (side / 2) + normal.x * overhang,
      centerZ: z + axis.z * (side / 2) + normal.z * overhang,
      turns,
      corner,
    });

    x += axis.x * side;
    z += axis.z * side;

    if (!corner) return;

    /*
     * Dönüşün geometrisi: yeni bacak, köşe modülünün İKİNCİ bacağının
     * bittiği yerden başlar ve sırtı aynı duvara dayanır — imleç bir kenar
     * boyu ileri, bir yarım derinlik geri kayar.
     */
    x += normal.x * (side - depthCm / 2) - axis.x * (depthCm / 2);
    z += normal.z * (side - depthCm / 2) - axis.z * (depthCm / 2);
    turns += 1;
  });

  const bounds = boundsOf(rects, depthCm);
  const shiftX = (bounds.minX + bounds.maxX) / 2;
  const shiftZ = (bounds.minZ + bounds.maxZ) / 2;

  return rects.map((rect) => ({
    ...rect,
    centerX: rect.centerX - shiftX,
    centerZ: rect.centerZ - shiftZ,
  }));
};

/**
 * Modülün KENDİ çerçevesindeki bir noktayı sahnedeki yere çevirir: yerel +x
 * modülün genişliği, yerel +z cephesi. Parça üreticileri böylece modülün
 * dönüp dönmediğini bilmek zorunda kalmıyor — dönüşü tek bu fonksiyon biliyor.
 *
 * Ölçüler cm girer, yerleşim METRE çıkar: sahne metre ölçeğinde çalışıyor.
 */
export const placeIn = (
  rect: IModuleRect,
  localX: number,
  y: number,
  localZ: number,
  /**
   * Parçanın modül içindeki KENDİ dönüşü. Köşe modülünün ikinci cephesi ve o
   * cepheyi örten kanat, modülün diğer parçalarına dik duruyor.
   */
  quarterTurns = 0,
): IPartPlacement => {
  const { axis, normal } = frameOf(rect.turns);
  const turns = rect.turns + quarterTurns;

  return {
    x: (rect.centerX + localX * axis.x + localZ * normal.x) * CM,
    y: y * CM,
    z: (rect.centerZ + localX * axis.z + localZ * normal.z) * CM,
    /* `turns * QUARTER_TURN` dönüşsüz modülde -0 üretiyor; sıfır sıfırdır. */
    rotationY: turns ? turns * QUARTER_TURN : 0,
  };
};
