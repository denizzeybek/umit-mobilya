import { BACK_PANELS, DOOR_TYPES, FINISHES, MATERIALS } from './catalog';

import type { IPriceBook, IProductSettings } from '../priceBook';

/**
 * Fiyat kitabının tamamı. Admin paneli gelene kadar tek kaynak burası; panel
 * geldiğinde bu nesne API boş ya da erişilemez olduğunda devreye giren yedeğe
 * dönüşür. Site API olmadan da ayakta kalmalı.
 */

/**
 * Menteşe adedi kanat YÜKSEKLİĞİNE göre okunur, genişliğine göre değil.
 * Atölyeden doğrulandı.
 *
 * Son kademe `Infinity` DEĞİL büyük bir sonlu sayı: kitap API'den JSON olarak
 * geçiyor ve JSON `Infinity` taşıyamaz — `null`a dönüşüp sıralamayı bozuyordu.
 */
const HINGE_STEPS = [
  { maxHeightCm: 100, count: 2 },
  { maxHeightCm: 160, count: 3 },
  { maxHeightCm: 200, count: 4 },
  { maxHeightCm: 240, count: 5 },
  { maxHeightCm: 10_000, count: 6 },
];

const GARDIROP: IProductSettings = {
  width: { min: 60, max: 400, step: 5 },
  height: { min: 160, max: 280, step: 5 },
  /*
   * Tavan 80'den 120'ye çıktı. 80 gardırop için tipik derinliğin (60) çok
   * üstünde ama yürümeli/giyinme odası dolapları ve raflı depo çözümleri
   * daha derin isteniyor — atölye bunu zaten yapıyordu, sınır arayüzde
   * duruyordu.
   */
  depth: { min: 40, max: 120, step: 5 },
  sectionCount: { min: 1, max: 8 },
  maxModuleWidthCm: 200,
  maxDoorLeafWidthCm: 119,
  defaultMaterial: 'mdf-gloss',
  defaultDoorType: 'kulpsuz',
};

const VESTIYER: IProductSettings = {
  width: { min: 60, max: 320, step: 5 },
  height: { min: 160, max: 240, step: 5 },
  depth: { min: 28, max: 45, step: 1 },
  sectionCount: { min: 1, max: 5 },
  maxModuleWidthCm: 200,
  maxDoorLeafWidthCm: 119,
  defaultMaterial: 'mdf-gloss',
  defaultDoorType: 'yok',
};

export const DEFAULT_PRICE_BOOK: IPriceBook = {
  version: 0,
  currency: 'TRY',
  materials: MATERIALS,
  finishes: FINISHES,
  doorTypes: DOOR_TYPES,
  backPanels: BACK_PANELS,

  edgeBand: { pricePerM: 45, appliedTo: 'visible' },

  hardware: {
    hinge: { pricePerUnit: 35, countByDoorHeight: HINGE_STEPS },
    handle: { pricePerUnit: 120 },
    /* Ray ve çekmece malzemesi bu fiyatın içinde — ayrı kalem yok. */
    drawer: { pricePerUnit: 950 },
    rail: { pricePerM: 180 },
  },

  /*
   * Üç yöntem de destekleniyor; admin hangisini seçerse paneldeki alanlar da
   * ona göre değişir. Tohum m² üstünden, çünkü ölçüyle ölçeklenen tek yöntem
   * bu ve panel yazılana kadar en az sürpriz üreteni.
   */
  labour: { method: 'perM2', perM2: 350, assemblyFlat: 1500 },

  delivery: { enabled: false, label: 'Nakliye ve montaj', flat: 2500 },

  /* Müşteriye satır olarak gösterilmez; toplama gömülüdür. */
  margin: { multiplier: 1.25 },

  vat: { rate: 0.2, included: false },

  /*
   * Brüt konvansiyonda fire zaten dış ölçüyle örtülüyor; `net` seçilirse
   * admin buraya bir pay girer.
   */
  waste: { percent: 0 },
  areaConvention: 'gross',

  products: {
    gardirop: GARDIROP,
    vestiyer: VESTIYER,
  },
};
