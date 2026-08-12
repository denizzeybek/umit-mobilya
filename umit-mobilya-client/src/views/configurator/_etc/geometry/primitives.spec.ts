import { MeshStandardMaterial } from 'three';
import { describe, expect, it } from 'vitest';

import { box } from './primitives';

/**
 * Kutu UV'lerinin GERÇEK ÖLÇÜYE göre ölçeklenmesi.
 *
 * `BoxGeometry` her yüze 0–1 UV veriyor. Paylaşılan bir desen o hâliyle 40
 * cm'lik rafta da 240 cm'lik kapakta da aynı sayıda tekrar eder: raf doğru
 * görünürken kapaktaki damar altı kat gerilir. Ekranda "biraz tuhaf" diye
 * görünen, hiçbir testin yakalamadığı türden bir hata.
 */
const uvSpan = (
  w: number,
  h: number,
  d: number,
  face: number,
): { u: number; v: number } => {
  const mesh = box(new MeshStandardMaterial(), w, h, d, 0, 0, 0);
  const uv = mesh.geometry.attributes['uv'];
  if (!uv) throw new Error('UV yok');

  const first = face * 4;
  const us: number[] = [];
  const vs: number[] = [];

  for (let corner = 0; corner < 4; corner += 1) {
    us.push(uv.getX(first + corner));
    vs.push(uv.getY(first + corner));
  }

  return {
    u: Math.max(...us) - Math.min(...us),
    v: Math.max(...vs) - Math.min(...vs),
  };
};

describe('box UV ölçeklemesi', () => {
  /* BoxGeometry yüz sırası: +X, -X, +Y, -Y, +Z, -Z. */
  const FRONT = 4;
  const SIDE = 0;
  const TOP = 2;

  it('ön yüz genişlik ve yükseklik kadar uzanır', () => {
    expect(uvSpan(2, 1, 0.5, FRONT)).toEqual({ u: 2, v: 1 });
  });

  it('yan yüz derinlik ve yükseklik kadar uzanır', () => {
    expect(uvSpan(2, 1, 0.5, SIDE)).toEqual({ u: 0.5, v: 1 });
  });

  it('üst yüz genişlik ve derinlik kadar uzanır', () => {
    expect(uvSpan(2, 1, 0.5, TOP)).toEqual({ u: 2, v: 0.5 });
  });

  /*
   * Asıl mesele bu: iki farklı boyuttaki panel aynı desen yoğunluğunu
   * göstermeli. Eski davranışta ikisi de 1 döndüğü için kapaktaki damar
   * raftakinin altı katı gerilmiş oluyordu.
   */
  it('iki kat geniş panelin UV alanı iki katıdır', () => {
    const narrow = uvSpan(1, 2, 0.02, FRONT);
    const wide = uvSpan(2, 2, 0.02, FRONT);

    expect(wide.u).toBe(narrow.u * 2);
    expect(wide.v).toBe(narrow.v);
  });
});
