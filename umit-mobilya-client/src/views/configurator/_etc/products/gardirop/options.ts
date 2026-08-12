import { PANEL_THICKNESS_CM } from '../../catalog';

import type { IProductLimits } from '../../types';
import type { IGardiropConfig, IGardiropSection } from './types';

/**
 * Gardıroba özel ayarlar. Malzeme ve kaplama kataloğu paylaşıldığı için burada
 * değil (`_etc/catalog.ts`); burada yalnızca bu ürünün ölçü sınırları, parça
 * fiyatları ve hazır düzenleri var.
 */
export const LIMITS: IProductLimits = {
  width: { min: 60, max: 400, step: 5 },
  height: { min: 160, max: 280, step: 5 },
  depth: { min: 40, max: 80, step: 5 },
  sectionCount: { min: 1, max: 8 },
};

export const DRAWER_LIMIT = { min: 0, max: 8 };

export const PART_PRICES = {
  shelf: 380,
  rail: 260,
  drawer: 950,
};

/**
 * Hazır düzenler bölüm yüksekliğine göre değil sabit cm ile tanımlı, çünkü
 * kullanıcı bunları başlangıç noktası olarak kullanıp üzerinde oynuyor.
 * Yüksekliğe sığmayan değerler sahne üreticisinde eleniyor.
 *
 * Genişlik bilerek dışarıda: düzen değiştirmek bölümü daraltmamalı, o ölçü
 * kullanıcının kendi kararı.
 */
export const PRESETS: {
  id: string;
  label: string;
  build: () => Omit<IGardiropSection, 'width'>;
}[] = [
  {
    id: 'tam-rafli',
    label: 'Tam raflı',
    build: () => ({ shelves: [35, 70, 105, 140, 175], rails: [], drawers: 0 }),
  },
  {
    id: 'tek-askili',
    label: 'Tek askılı',
    build: () => ({ shelves: [35], rails: [42], drawers: 0 }),
  },
  {
    id: 'cift-askili',
    label: 'Çift askılı',
    build: () => ({ shelves: [35, 115], rails: [42, 122], drawers: 0 }),
  },
  {
    id: 'cekmece-askilik',
    label: 'Çekmece + askılık',
    build: () => ({ shelves: [35, 120], rails: [42], drawers: 3 }),
  },
  {
    id: 'cekmeceli',
    label: 'Çekmeceli',
    build: () => ({ shelves: [35, 100], rails: [42], drawers: 5 }),
  },
  {
    id: 'tam-cekmeceli',
    label: 'Tam çekmeceli',
    build: () => ({ shelves: [], rails: [], drawers: 8 }),
  },
];

/** "Standart düzeni yükle" düğmesinin yüklediği düzen. */
export const STANDARD_PRESET = PRESETS[3];

export const createSection = (width: number): IGardiropSection => ({
  width,
  shelves: [35, 120],
  rails: [42],
  drawers: 0,
});

/**
 * Açılış her zaman eşit bölünmüş: bölüm genişlikleri sabit yazılmıyor, gövde
 * ölçüsünden hesaplanıyor. Sabit bir sayı yazılsaydı varsayılan genişlik ya da
 * panel kalınlığı değiştiğinde bölümler gövdeye oturmayıp boşluk bırakırdı.
 */
export const createDefaultConfig = (): IGardiropConfig => {
  const width = 180;
  const sectionCount = 2;
  const inner = width - (sectionCount + 1) * PANEL_THICKNESS_CM;
  const each = Math.round((inner / sectionCount) * 100) / 100;

  return {
    width,
    height: 220,
    depth: 60,
    sectionCount,
    material: 'lak',
    finish: 'mese',
    backPanel: 8,
    doorStyle: 'kulpsuz',
    doorOpen: 0,
    sections: Array.from({ length: sectionCount }, () => createSection(each)),
  };
};
