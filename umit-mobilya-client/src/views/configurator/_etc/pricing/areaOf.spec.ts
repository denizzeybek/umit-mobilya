import { describe, expect, it } from 'vitest';

import { areaOf, edgeLengthOf, perimeterOf } from './areaOf';

import type { IPart } from './types';

const panel = (extra: Partial<IPart> = {}): IPart => ({
  kind: 'ust',
  partClass: 'panel',
  moduleIndex: 0,
  materialRole: 'carcass',
  label: 'Üst',
  qty: 1,
  size: { w: 56.4, h: 1.8, d: 60 },
  grossSize: { w: 60, h: 1.8, d: 60 },
  ...extra,
});

describe('areaOf', () => {
  /*
   * Alan en büyük İKİ eksenden çıkıyor; ince eksen kalınlıktır. Bu kural
   * sayesinde kapakta derinliğin hesaba girmemesi ayrı bir koşul değil,
   * geometrinin doğal sonucu.
   */
  it('panelin en büyük iki ekseninden hesaplanır', () => {
    const kapak = panel({
      kind: 'kapak',
      size: { w: 60, h: 180, d: 1.8 },
      grossSize: { w: 60, h: 180, d: 1.8 },
    });

    expect(areaOf(kapak, 'net')).toBeCloseTo(1.08, 6);
  });

  it('yan panel yükseklik x derinlik verir', () => {
    const yan = panel({
      kind: 'yan-panel',
      size: { w: 1.8, h: 180, d: 60 },
      grossSize: { w: 1.8, h: 180, d: 60 },
    });

    expect(areaOf(yan, 'net')).toBeCloseTo(1.08, 6);
  });

  it('brüt konvansiyon modülün dış ölçüsünü kullanır', () => {
    expect(areaOf(panel(), 'gross')).toBeCloseTo(0.36, 6);
  });

  it('net konvansiyon gerçek kesim ölçüsünü kullanır', () => {
    expect(areaOf(panel(), 'net')).toBeCloseTo(0.3384, 6);
  });

  it('brüt ölçü yoksa kesim ölçüsüne düşer', () => {
    const eksik = panel({ grossSize: undefined });

    expect(areaOf(eksik, 'gross')).toBeCloseTo(0.3384, 6);
  });

  it('ölçüsü olmayan donanım sıfır alan verir', () => {
    const kulp = panel({
      kind: 'kulp',
      partClass: 'hardware',
      size: undefined,
      grossSize: undefined,
    });

    expect(areaOf(kulp, 'gross')).toBe(0);
  });
});

describe('perimeterOf', () => {
  it('en büyük iki eksenin çevresini metre olarak verir', () => {
    expect(perimeterOf(panel(), 'gross')).toBeCloseTo(2.4, 6);
  });

  it('ölçüsüz parçada sıfırdır', () => {
    expect(perimeterOf(panel({ size: undefined, grossSize: undefined }), 'net')).toBe(0);
  });
});

describe('edgeLengthOf', () => {
  it('görünen kenar modunda parçanın kendi metrajını kullanır', () => {
    const raf = panel({ kind: 'raf', bandedEdgeM: 0.9 });

    expect(edgeLengthOf(raf, 'visible', 'gross')).toBeCloseTo(0.9, 6);
  });

  it('görünen kenar modunda metraj yoksa sıfırdır', () => {
    expect(edgeLengthOf(panel(), 'visible', 'gross')).toBe(0);
  });

  /*
   * `all` atölye "hepsini bantlarım" dediğinde: parçanın kendi metrajı YOK
   * SAYILIR. İki alanın çelişmesi mümkün değil çünkü biri diğerini devre
   * dışı bırakıyor.
   */
  it('tüm kenarlar modunda parçanın metrajını yok sayıp çevreyi alır', () => {
    const raf = panel({ kind: 'raf', bandedEdgeM: 0.9 });

    expect(edgeLengthOf(raf, 'all', 'gross')).toBeCloseTo(2.4, 6);
  });

  it('donanımda kenar bandı yoktur', () => {
    const mentese = panel({
      kind: 'mentese',
      partClass: 'hardware',
      size: undefined,
      grossSize: undefined,
      bandedEdgeM: 5,
    });

    expect(edgeLengthOf(mentese, 'all', 'gross')).toBe(0);
    expect(edgeLengthOf(mentese, 'visible', 'gross')).toBe(0);
  });
});
