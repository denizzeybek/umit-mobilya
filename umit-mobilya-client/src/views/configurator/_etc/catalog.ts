import type {
  TBackPanel,
  TDoorStyle,
  TFinishId,
  TMaterialId,
} from './types';

/**
 * Malzeme, kaplama ve donanım kataloğu — her ürün tipinde aynı. Atölye meşeyi
 * gardıropta da mutfakta da aynı fiyata işliyor; iki ayrı katalog tutmak
 * bunları er geç birbirinden ayırırdı.
 *
 * Buradaki renkler ÜRÜN KAPLAMASI, arayüz teması değil — bu yüzden
 * `constants/colors.ts` değil burası. Değerler doğrudan Three.js malzemesine
 * gider; `swatch` ise panelde gösterilen daire.
 */
export const FINISHES: {
  id: TFinishId;
  label: string;
  color: number;
  swatch: string;
}[] = [
  { id: 'beyaz', label: 'Beyaz', color: 0xedeae4, swatch: '#EDEAE4' },
  { id: 'antrasit', label: 'Antrasit', color: 0x33363a, swatch: '#33363A' },
  { id: 'mese', label: 'Meşe', color: 0xc39a6b, swatch: '#C39A6B' },
  { id: 'ceviz', label: 'Ceviz', color: 0x6b4a32, swatch: '#6B4A32' },
];

/**
 * `roughness` ve `clearcoat` yüzeyin nasıl parladığını belirliyor; `pricePerM2`
 * fiyat tahmininin ana kalemi. İkisi de aynı seçimden türediği için tek tabloda.
 */
export const MATERIALS: {
  id: TMaterialId;
  label: string;
  roughness: number;
  clearcoat: number;
  pricePerM2: number;
}[] = [
  {
    id: 'suntalam',
    label: 'Suntalam',
    roughness: 0.78,
    clearcoat: 0,
    pricePerM2: 1400,
  },
  {
    id: 'mdf-lam',
    label: 'MDF Lam',
    roughness: 0.6,
    clearcoat: 0.1,
    pricePerM2: 1900,
  },
  {
    id: 'lak',
    label: 'Lak Panel',
    roughness: 0.34,
    clearcoat: 0.5,
    pricePerM2: 2900,
  },
  {
    id: 'mdf-gloss',
    label: 'MDF High Gloss',
    roughness: 0.12,
    clearcoat: 1,
    pricePerM2: 3400,
  },
];

export const DOOR_STYLES: { id: TDoorStyle; label: string; price: number }[] = [
  { id: 'kulplu', label: 'Kulplu kapak', price: 1500 },
  { id: 'kulpsuz', label: 'Kulpsuz kapak', price: 1900 },
  { id: 'yok', label: 'Kapaksız', price: 0 },
];

export const BACK_PANELS: { id: TBackPanel; label: string; price: number }[] = [
  { id: 4, label: '4 mm (standart)', price: 300 },
  { id: 8, label: '8 mm', price: 520 },
  { id: 18, label: '18 mm (tam gövde)', price: 1100 },
];

export const PANEL_THICKNESS_CM = 1.8;

/** Altına inildiğinde askılık ve çekmece imal edilemeyen pratik alt sınır. */
export const MIN_SECTION_WIDTH = 20;
