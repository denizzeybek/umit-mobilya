/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
import { PANEL_THICKNESS_CM } from '../../geometry/units';
import { DEFAULT_PRICE_BOOK } from '../../pricing/defaults';

import type { IVestiyerConfig, IVestiyerSection } from './types';

/**
 * Vestiyer gardıroptan daha sığ ve daha alçak: antrede duruyor, içine palto
 * asılıyor ama gardırop derinliği kapıyı kapatır.
 */
export const SHOE_SHELF_LIMIT = { min: 0, max: 4 };

export const PRESETS: {
  id: string;
  label: string;
  build: () => Omit<IVestiyerSection, 'width'>;
}[] = [
  {
    id: 'oturakli',
    label: 'Oturaklı',
    build: () => ({
      benchFromFloor: 45,
      shoeShelves: 2,
      shelves: [25],
      hookRail: 60,
    }),
  },
  {
    id: 'askilik',
    label: 'Sadece askılık',
    build: () => ({
      benchFromFloor: null,
      shoeShelves: 0,
      shelves: [25],
      hookRail: 60,
    }),
  },
  {
    id: 'ayakkabilik',
    label: 'Ayakkabılık',
    build: () => ({
      benchFromFloor: 50,
      shoeShelves: 4,
      shelves: [],
      hookRail: null,
    }),
  },
  {
    id: 'rafli',
    label: 'Raflı',
    build: () => ({
      benchFromFloor: null,
      shoeShelves: 0,
      shelves: [25, 60, 95, 130],
      hookRail: null,
    }),
  },
];

export const createSection = (width: number): IVestiyerSection => ({
  width,
  benchFromFloor: 45,
  shoeShelves: 2,
  shelves: [25],
  hookRail: 60,
});

/**
 * Açılış eşit bölünmüş ve KAPAKSIZ: vestiyer açık bir mobilya, kapak istisna.
 * Genişlikler gövde ölçüsünden hesaplanıyor, sabit yazılmıyor.
 */
/*
 * Varsayılan malzeme ve kapak tipi fiyat kitabından okunuyor, burada
 * SABİT DEĞİL: iki yerde yazıldığında katalog değişince biri sessizce
 * geçersiz kimlik taşımaya başlıyor ve `priceOf` haklı olarak patlıyor.
 */
export const createDefaultConfig = (): IVestiyerConfig => {
  const settings = DEFAULT_PRICE_BOOK.products.vestiyer;

  /*
   * Ayar yoksa erken düş: alan `undefined` kalınca hata üç kare sonra `priceOf`
   * içinde "Katalogda yok: undefined" olarak çıkıyor ve panel sessizce hiç
   * render olmuyor. Sunucunun sıkı derleyicisi bu kontrolü zaten zorunlu
   * kılıyor — bu dosya fiyat ağı için oraya kopyalanıyor.
   */
  if (!settings) throw new Error('Fiyat kitabında vestiyer ayarı yok.');

  const width = 140;
  const sectionCount = 2;
  const inner = width - 2 * sectionCount * PANEL_THICKNESS_CM;
  const each = Math.round((inner / sectionCount) * 100) / 100;

  return {
    width,
    height: 200,
    depth: 35,
    sectionCount,
    material: settings.defaultMaterial,
    finish: 'mese',
    backPanel: 8,
    doorType: settings.defaultDoorType,
    doorOpen: 0,
    sections: Array.from({ length: sectionCount }, () => createSection(each)),
  };
};
