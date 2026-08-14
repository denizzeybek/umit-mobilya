/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
import { PANEL_THICKNESS_CM } from '../../geometry/units';
import { DEFAULT_PRICE_BOOK } from '../../pricing/defaults';

import type { IGardiropConfig, IGardiropSection } from './types';

/**
 * Gardıroba özel ayarlar. Malzeme ve kaplama kataloğu paylaşıldığı için burada
 * değil (`_etc/catalog.ts`); burada yalnızca bu ürünün ölçü sınırları, parça
 * fiyatları ve hazır düzenleri var.
 */
export const DRAWER_LIMIT = { min: 0, max: 8 };

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
  build: () => Omit<IGardiropSection, 'width' | 'corner'>;
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

/**
 * `corner` bilerek AÇIKÇA `false`: `sanitizeConfig` gelen bölümü şablonun
 * anahtarları üstünden birleştiriyor, yani şablonda olmayan bir alan
 * paylaşılan bağlantıdan sessizce düşerdi.
 */
export const createSection = (width: number): IGardiropSection => ({
  width,
  corner: false,
  shelves: [35, 120],
  rails: [42],
  drawers: 0,
});

/**
 * Açılış her zaman eşit bölünmüş: bölüm genişlikleri sabit yazılmıyor, gövde
 * ölçüsünden hesaplanıyor. Sabit bir sayı yazılsaydı varsayılan genişlik ya da
 * panel kalınlığı değiştiğinde bölümler gövdeye oturmayıp boşluk bırakırdı.
 */
/*
 * Varsayılan malzeme ve kapak tipi fiyat kitabından okunuyor, burada
 * SABİT DEĞİL: iki yerde yazıldığında katalog değişince biri sessizce
 * geçersiz kimlik taşımaya başlıyor ve `priceOf` haklı olarak patlıyor.
 */
export const createDefaultConfig = (): IGardiropConfig => {
  const settings = DEFAULT_PRICE_BOOK.products.gardirop;

  /*
   * Ayar yoksa erken düş: alan `undefined` kalınca hata üç kare sonra `priceOf`
   * içinde "Katalogda yok: undefined" olarak çıkıyor ve panel sessizce hiç
   * render olmuyor. Sunucunun sıkı derleyicisi bu kontrolü zaten zorunlu
   * kılıyor — bu dosya fiyat ağı için oraya kopyalanıyor.
   */
  if (!settings) throw new Error('Fiyat kitabında gardirop ayarı yok.');

  const width = 180;
  const sectionCount = 2;
  const inner = width - 2 * sectionCount * PANEL_THICKNESS_CM;
  const each = Math.round((inner / sectionCount) * 100) / 100;

  return {
    width,
    height: 220,
    depth: 60,
    sectionCount,
    material: settings.defaultMaterial,
    finish: 'mese',
    backPanel: 8,
    doorType: settings.defaultDoorType,
    doorOpen: 0,
    sections: Array.from({ length: sectionCount }, () => createSection(each)),
  };
};
