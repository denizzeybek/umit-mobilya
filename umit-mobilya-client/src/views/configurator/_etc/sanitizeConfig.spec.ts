import { describe, expect, it } from 'vitest';

import { carcassWidthOf } from './geometry/sectionWidths';
import { gardiropDefinition } from './products/gardirop';
import { createDefaultConfig } from './products/gardirop/options';
import { sanitizeConfig } from './sanitizeConfig';

import type { IGardiropConfig } from './products/gardirop/types';

const clean = (incoming: unknown): IGardiropConfig =>
  sanitizeConfig(incoming, gardiropDefinition) as IGardiropConfig;

const { limits } = gardiropDefinition;

describe('sanitizeConfig', () => {
  it('geçerli bir config değişmeden geçer', () => {
    const config = createDefaultConfig();

    expect(clean(config)).toEqual(config);
  });

  it('nesne olmayan girdi varsayılana düşer', () => {
    expect(clean(null)).toEqual(createDefaultConfig());
    expect(clean('gardirop')).toEqual(createDefaultConfig());
    expect(clean([])).toEqual(createDefaultConfig());
  });

  it('eksik alanlar varsayılanda kalır', () => {
    expect(clean({ height: 200 })).toEqual({
      ...createDefaultConfig(),
      height: 200,
    });
  });

  it('bilinmeyen malzeme ve kaplama varsayılana düşer', () => {
    const result = clean({ material: 'altin', finish: 'gokkusagi' });

    expect(result.material).toBe(createDefaultConfig().material);
    expect(result.finish).toBe(createDefaultConfig().finish);
  });

  it('tanınan malzeme ve kaplama geçer', () => {
    const result = clean({ material: 'suntalam', finish: 'ceviz' });

    expect(result.material).toBe('suntalam');
    expect(result.finish).toBe('ceviz');
  });

  it('ölçüler ürünün sınırlarına oturtulur', () => {
    const tooBig = clean({ height: 9999, depth: 9999 });
    const tooSmall = clean({ height: -5, depth: 0 });

    expect(tooBig.height).toBe(limits.height.max);
    expect(tooBig.depth).toBe(limits.depth.max);
    expect(tooSmall.height).toBe(limits.height.min);
    expect(tooSmall.depth).toBe(limits.depth.min);
  });

  it('bölüm sayısı sınırların dışına çıkamaz', () => {
    expect(clean({ sectionCount: 99 }).sectionCount).toBe(
      limits.sectionCount.max,
    );
    expect(clean({ sectionCount: 0 }).sectionCount).toBe(
      limits.sectionCount.min,
    );
  });

  it('kapak açısı 0-1 aralığına sıkıştırılır', () => {
    expect(clean({ doorOpen: 7 }).doorOpen).toBe(1);
    expect(clean({ doorOpen: -7 }).doorOpen).toBe(0);
  });

  it('sayı olmayan ölçü varsayılanda kalır', () => {
    const result = clean({ height: 'yüksek', depth: null, doorOpen: {} });

    expect(result.height).toBe(createDefaultConfig().height);
    expect(result.depth).toBe(createDefaultConfig().depth);
    expect(result.doorOpen).toBe(createDefaultConfig().doorOpen);
  });

  /*
   * `dimensionOps`'un değişmezi: gövde genişliği bölümlerden TÜRETİLİR.
   * URL'de yazan `width` bilerek yok sayılıyor — kurcalanmış bir sayı gövdeyi
   * bölümlerinden koparırdı.
   */
  it('gövde genişliği bölümlerden türetilir, URLdeki değer yok sayılır', () => {
    const result = clean({ ...createDefaultConfig(), width: 12345 });

    expect(result.width).toBe(
      carcassWidthOf(result.sections, result.sectionCount),
    );
  });

  it('ürüne özel bölüm alanları geçer', () => {
    const result = clean({
      sectionCount: 1,
      sections: [{ width: 80, shelves: [30, 60], rails: [45], drawers: 2 }],
    });

    expect(result.sections[0].shelves).toEqual([30, 60]);
    expect(result.sections[0].rails).toEqual([45]);
    expect(result.sections[0].drawers).toBe(2);
  });

  /*
   * Asıl beyaz-ekran koruması: `shelves` dizi değilse `buildGardirop`
   * içindeki `for...of` çalışma zamanında patlıyor.
   */
  it('yanlış biçimli bölüm alanı şablondaki değerde kalır', () => {
    const template = createDefaultConfig().sections[0];

    const result = clean({
      sectionCount: 1,
      sections: [{ width: 80, shelves: 'hepsi', rails: null, drawers: [] }],
    });

    expect(result.sections[0].shelves).toEqual(template.shelves);
    expect(result.sections[0].rails).toEqual(template.rails);
    expect(result.sections[0].drawers).toBe(template.drawers);
  });

  it('dizi içindeki sayı olmayan öğe tüm alanı reddettirir', () => {
    const template = createDefaultConfig().sections[0];

    const result = clean({
      sectionCount: 1,
      sections: [{ width: 80, shelves: [30, 'orta', 60] }],
    });

    expect(result.sections[0].shelves).toEqual(template.shelves);
  });

  it('bilinmeyen bölüm alanı gövdeye sızmaz', () => {
    const result = clean({
      sectionCount: 1,
      sections: [{ width: 80, kasa: 'gizli' }],
    });

    expect(result.sections[0]).not.toHaveProperty('kasa');
  });

  it('eksik bölüm ürünün kendi fabrikasından doldurulur', () => {
    const result = clean({ sectionCount: 3, sections: [{ width: 80 }] });

    expect(result.sections).toHaveLength(3);
    expect(result.sections[2]).toHaveProperty('shelves');
  });

  it('çıktı her zaman ürünün build fonksiyonuna verilebilir', () => {
    const build = gardiropDefinition.build(
      clean({ sectionCount: 2, sections: [{ shelves: 'yok' }, null] }),
    );

    expect(build.group.children.length).toBeGreaterThan(0);
    build.dispose();
  });
});
