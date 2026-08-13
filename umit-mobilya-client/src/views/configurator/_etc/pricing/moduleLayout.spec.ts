import { describe, expect, it } from 'vitest';

import { boundsOf, moduleRects, placeIn } from './moduleLayout';

/**
 * Köşe modülü sıranın DÖNDÜĞÜ yer. Buradaki testler dönüşün üç şartını
 * çiviliyor: dönen bacak doğru yöne bakar, biten bacağın üstüne binmez, ve
 * köşesiz bir sıra dönüş kodundan hiç etkilenmez.
 *
 * Üçüncüsü en kritik olan: bugünkü bütün tasarımlar köşesiz ve sahnedeki
 * yerleri kaymamalı.
 */
const straight = (count: number, bayWidth = 56.4) =>
  Array.from({ length: count }, () => ({ bayWidth }));

const DEPTH = 60;
const T = 1.8;
const QUARTER = -Math.PI / 2;

describe('moduleRects — köşesiz sıra', () => {
  it('bütün modüller dönüşsüzdür', () => {
    const rects = moduleRects(straight(3), T, DEPTH);

    expect(rects.every((rect) => rect.turns === 0)).toBe(true);
  });

  it('gövde x ekseninde ortalanır, z ekseninde derinliğe oturur', () => {
    const rects = moduleRects(straight(3), T, DEPTH);
    const bounds = boundsOf(rects, DEPTH);

    expect(bounds.minX).toBeCloseTo(-90, 6);
    expect(bounds.maxX).toBeCloseTo(90, 6);
    expect(bounds.minZ).toBeCloseTo(-30, 6);
    expect(bounds.maxZ).toBeCloseTo(30, 6);
  });
});

describe('moduleRects — köşe modülü', () => {
  /*
   * Modül dış genişliği 90, derinlik 60: bilerek farklı. Eşit olduklarında L
   * dejenere oluyor (dönen bacak, biten bacakla aynı x şeridine düşüyor) ve
   * yerleşimi ölçen test hiçbir şey kanıtlamıyor.
   */
  const withCorner = () =>
    moduleRects(
      [{ bayWidth: 86.4, corner: true }, { bayWidth: 86.4 }],
      T,
      DEPTH,
    );

  it('köşe modülünün kendisi dönmez, ondan SONRASI döner', () => {
    const rects = withCorner();

    expect(rects[0].turns).toBe(0);
    expect(rects[1].turns).toBe(1);
  });

  /*
   * Kenar = cephe + derinlik: köşe modülü sırada kendi genişliğinden bir
   * derinlik kadar fazla yer kaplıyor, çünkü o fazlalık ikinci bacağı.
   */
  const SIDE = 90 + DEPTH;

  it('köşe modülünün ayak izi, genişliği artı derinliği kadar karedir', () => {
    const bounds = boundsOf([...withCorner()].slice(0, 1), DEPTH);

    expect(bounds.maxX - bounds.minX).toBeCloseTo(SIDE, 6);
    expect(bounds.maxZ - bounds.minZ).toBeCloseTo(SIDE, 6);
  });

  it('dönen bacak köşe modülünün İKİNCİ bacağından sonra başlar', () => {
    const rects = withCorner();

    /* Köşenin bittiği yer ile dönen modülün başladığı yer aynı düzlem:
       ne bindirme var ne boşluk. */
    const cornerEnd = rects[0].centerZ + SIDE / 2;
    const turnedStart = rects[1].centerZ - rects[1].outerWidth / 2;

    expect(turnedStart).toBeCloseTo(cornerEnd, 6);
  });

  it('dönen modülün sırtı köşe modülüyle aynı hizada durur', () => {
    const rects = withCorner();

    const cornerRight = rects[0].centerX + SIDE / 2;
    const turnedBack = rects[1].centerX + DEPTH / 2;

    expect(turnedBack).toBeCloseTo(cornerRight, 6);
  });

  it('ayak izi L olur: derinlik artık modül derinliği değildir', () => {
    const bounds = boundsOf(withCorner(), DEPTH);

    /* x: köşe kenarı (150). z: köşe kenarı artı dönen modülün genişliği. */
    expect(bounds.maxX - bounds.minX).toBeCloseTo(SIDE, 6);
    expect(bounds.maxZ - bounds.minZ).toBeCloseTo(SIDE + 90, 6);
  });

  it('iki köşe sırayı 180° çevirir', () => {
    const rects = moduleRects(
      [
        { bayWidth: 56.4, corner: true },
        { bayWidth: 56.4, corner: true },
        { bayWidth: 56.4 },
      ],
      T,
      DEPTH,
    );

    expect(rects[2].turns).toBe(2);
  });
});

describe('placeIn', () => {
  it('dönüşsüz modülde yerel eksenler dünya eksenleridir', () => {
    const [rect] = moduleRects(straight(1), T, DEPTH);
    const placement = placeIn(rect, 10, 100, 20);

    expect(placement.x).toBeCloseTo(0.1, 6);
    expect(placement.y).toBeCloseTo(1, 6);
    expect(placement.z).toBeCloseTo(0.2, 6);
    expect(placement.rotationY).toBe(0);
  });

  /*
   * Dönmüş modülde yerel +z (cephe) dünya -x'e bakar: kapağın önüne çıkan
   * yön budur, ve kapak pivotu bu dönüşü aynen uyguluyor.
   */
  it('dönmüş modülde cephe ekseni dünya -x olur', () => {
    const rects = moduleRects(
      [{ bayWidth: 86.4, corner: true }, { bayWidth: 86.4 }],
      T,
      DEPTH,
    );
    const turned = rects[1];

    const front = placeIn(turned, 0, 0, 30);
    const center = placeIn(turned, 0, 0, 0);

    expect(front.x - center.x).toBeCloseTo(-0.3, 6);
    expect(front.z - center.z).toBeCloseTo(0, 6);
    expect(turned.turns * QUARTER).toBeCloseTo(front.rotationY ?? 0, 6);
  });
});
