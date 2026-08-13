import { Object3D } from 'three';

import { box } from './primitives';

import type { IPart } from '../pricing/types';
import type { IProductBuild } from '../types';
import type { IProductMaterials } from './primitives';
import type { Group } from 'three';

/**
 * Kapak kanatlarının pivot ağacı ve açılma hareketi. Gövdenin kutularından
 * ayrı duruyor çünkü kapak tek bir mesh değil bir MEKANİZMA: menteşe kenarı,
 * dönüş ekseni, katlanır çiftte de ebeveyn-çocuk ilişkisi var.
 */

const CM = 0.01;
const DOOR_GAP = 0.003;
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

  /*
   * Açı modülün KENDİ dönüşünün üstüne biniyor: köşeden sonraki modüller
   * komşu duvara dönük ve kapakları da o cepheye göre açılmalı. Taban dönüş
   * eklenmediğinde dönmüş modüllerin kapakları kaydırıcı hareket eder etmez
   * gövdenin içine giriyordu.
   *
   * Katlanan kanat bir öncekinin ÇOCUĞU ve açısı ona göre ölçülüyor. Köşe
   * kapağı KAPALIYKEN iki kanat dik duruyor (ikisi de kendi cephesinde);
   * açılırken ikincisi birincinin üstüne katlanıyor, yani aradaki dik açı
   * kapanıyor. Bi-fold menteşenin yaptığı hareket bu.
   */
  for (const { pivot, hinge, baseRotationY, fold } of pivots) {
    const swing = hinge === 'left' ? -angle : angle;

    if (!fold) {
      pivot.rotation.y = baseRotationY + swing;
      continue;
    }

    /*
     * Katlanan kanat birincinin ÜSTÜNE kapanıyor: bağıl açı diklikten başlar
     * ve 180°'de, yani iki kanat üst üste geldiğinde durur.
     *
     * Ters yön denendi ve yanlıştı: kanatlar aynı düzleme açılınca uç uca
     * iki kanat boyunda tek bir panel gibi süpürüyor, komşu modülün kapağının
     * içinden geçiyorlardı. Katlanınca süpürdüğü yer tek kanat kadar kalıyor.
     */
    const folded = Math.min(Math.abs(baseRotationY) + angle, Math.PI);

    pivot.rotation.y = baseRotationY < 0 ? -folded : folded;
  }
};

/**
 * Kapaklar pivota bağlanıyor ki açı, sahne yeniden kurulmadan
 * güncellenebilsin. Menteşe yönü cepheye göre: soldaki yarı sola, sağdaki
 * yarı sağa açılır — modül sınırına göre değil, çünkü kullanıcı modülleri
 * değil kanat dizisini görüyor.
 *
 * Katlanır kanat (köşe kapağının ikincisi) gövdeye değil bir önceki kanadın
 * SERBEST kenarına bağlanıyor: pivotu onun çocuğu, yeri de onun yerel
 * çerçevesinde. Dünya koordinatına yerleştirilse kapak açılırken yerinde
 * kalır, katlanmazdı.
 */
export const addDoors = (
  group: Group,
  doors: IPart[],
  materials: IProductMaterials,
): IProductBuild['doorPivots'] => {
  const pivots: IProductBuild['doorPivots'] = [];
  let previous:
    | { pivot: Object3D; hinge: 'left' | 'right'; half: number; turn: number }
    | null = null;

  doors.forEach((part, index) => {
    const { size, placement } = part;
    if (!size || !placement) return;

    const fold = part.doorFold === true && previous !== null;
    const halfWidth = (size.w * CM) / 2;

    /*
     * Köşe kapağı DÖNÜŞÜN TERSİNE açılır: menteşe modülün açık kalan
     * kenarında, katlanan kanat da kör tarafta. Sıradaki yerine göre yön
     * seçilseydi köşe kapağı bazen komşu bacağın üstüne açılırdı.
     */
    const cornerCarrier = doors[index + 1]?.doorFold === true;
    const hinge = (
      fold && previous
        ? previous.hinge
        : cornerCarrier || index < doors.length / 2
          ? 'left'
          : 'right'
    ) satisfies 'left' | 'right';
    const sign = hinge === 'left' ? 1 : -1;
    const turn = placement.rotationY ?? 0;

    /*
     * Katlanan kanadın açısı EBEVEYNİNE göre: köşe kapağında ikinci kanat
     * birinciye dik duruyor, yani taban açısı o dik açının kendisi.
     */
    const baseRotationY = fold && previous ? turn - previous.turn : turn;

    const pivot = new Object3D();

    if (fold && previous) {
      pivot.position.set(sign * 2 * previous.half, 0, 0);
      pivot.rotation.y = baseRotationY;
      previous.pivot.add(pivot);
    } else {
      /*
       * Menteşe kapağın kendi genişlik ekseninde duruyor; modül dönmüşse o
       * eksen de dönüyor. Dünya x'ine sabit kaydırmak, dönmüş modüllerde
       * kapağı komşu modülün önüne taşıyordu.
       */
      const offset = -sign * halfWidth;

      pivot.position.set(
        placement.x + offset * Math.cos(baseRotationY),
        placement.y,
        placement.z - offset * Math.sin(baseRotationY),
      );
      pivot.rotation.y = baseRotationY;
      group.add(pivot);
    }

    pivot.add(
      box(
        materials.door,
        size.w * CM - DOOR_GAP * 2,
        size.h * CM - 0.01,
        size.d * CM,
        sign * halfWidth,
        0,
        0,
      ),
    );

    pivots.push({ pivot, hinge, baseRotationY, fold });
    previous = { pivot, hinge, half: halfWidth, turn };
  });

  return pivots;
};

/**
 * Kulp menteşenin KARŞI kenarında durur. Pivot menteşede olduğu için kapağın
 * serbest kenarı `2 x yarımGenişlik` uzakta; kulp oradan 5 cm içeride.
 */
export const addHandles = (
  doors: IPart[],
  pivots: IProductBuild['doorPivots'],
  materials: IProductMaterials,
): void => {
  doors.forEach((part, index) => {
    const pivot = pivots[index]?.pivot;
    const { size } = part;
    if (!pivot || !size) return;

    /*
     * Katlanır kapak tek parça gibi açılıyor, kulpu da tek: kulp katlanan
     * kanadın serbest kenarında durur, katlanma çizgisinin üstünde değil.
     */
    if (doors[index + 1]?.doorFold === true) return;

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
