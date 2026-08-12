import type {
  IBackPanel,
  IDoorType,
  IFinish,
  IMaterial,
} from '../priceBook';

/**
 * Katalog tohumu. Bu rakamlar TAHMİN; asıl veriyi admin paneli girecek.
 * Kodda durmalarının sebebi, panel yazılana kadar sitenin çalışır ve test
 * edilebilir kalması — ve API düştüğünde konfigüratörün açılmaya devam etmesi.
 *
 * Üç eksen var ve üçü birbirinden bağımsız: malzeme (gövde ve kapağı birlikte
 * fiyatlar), kapak tipi (aynı panel aynalı olduğunda farklı fiyatlanır) ve
 * kaplama (yüzey işlemi).
 */

/**
 * `hidden` SİLMEK DEĞİL gizlemektir. `material` bir config alanı ve
 * config'ler URL'de paylaşılıyor, tekliflerde donduruluyor. Kataloğdan
 * silinen bir kimlik, o kimliği taşıyan her paylaşılmış bağlantıyı ve her
 * geçmiş teklifi çözümsüz bırakırdı.
 */
export const MATERIALS: IMaterial[] = [
  {
    id: 'mdf-gloss',
    label: 'MDF High Gloss',
    thicknessMm: 18,
    pricePerM2: 2000,
    roughness: 0.12,
    clearcoat: 1,
  },
  {
    id: 'lak-panel',
    label: 'Lak Panel',
    thicknessMm: 18,
    pricePerM2: 2900,
    roughness: 0.34,
    clearcoat: 0.5,
  },
  {
    id: 'akrilik',
    label: 'Akrilik',
    thicknessMm: 18,
    pricePerM2: 3400,
    roughness: 0.08,
    clearcoat: 1,
  },
  {
    id: 'lake',
    label: 'Lake',
    thicknessMm: 18,
    pricePerM2: 3100,
    roughness: 0.22,
    clearcoat: 0.7,
  },
  {
    id: 'suntalam',
    label: 'Suntalam',
    thicknessMm: 18,
    pricePerM2: 1400,
    roughness: 0.78,
    clearcoat: 0,
    hidden: true,
  },
  {
    id: 'mdf-lam',
    label: 'MDF Lam',
    thicknessMm: 18,
    pricePerM2: 1900,
    roughness: 0.6,
    clearcoat: 0.1,
    hidden: true,
  },
];

/**
 * Buradaki renkler ÜRÜN KAPLAMASI, arayüz teması değil — bu yüzden
 * `constants/colors.ts` değil burası. `color` doğrudan Three.js malzemesine
 * gider, `swatch` panelde gösterilen daire.
 *
 * Ek ücret tohumda 0: admin bir rakam girene kadar hiçbir fiyat değişmez.
 */
export const FINISHES: IFinish[] = [
  {
    id: 'beyaz',
    label: 'Beyaz',
    color: 0xedeae4,
    swatch: '#EDEAE4',
    surchargePerM2: 0,
  },
  {
    id: 'antrasit',
    label: 'Antrasit',
    color: 0x33363a,
    swatch: '#33363A',
    surchargePerM2: 0,
  },
  {
    id: 'mese',
    label: 'Meşe',
    color: 0xc39a6b,
    swatch: '#C39A6B',
    surchargePerM2: 0,
  },
  {
    id: 'ceviz',
    label: 'Ceviz',
    color: 0x6b4a32,
    swatch: '#6B4A32',
    surchargePerM2: 0,
  },
];

/**
 * Kapak tipi malzemeden BAĞIMSIZ ikinci eksen: aynı MDF High Gloss panel,
 * aynalı kapak olarak farklı fiyatlanır. Hepsi m² üstünden.
 *
 * `includesHandle` kulp kalemini `partsOf`a ürettirir; kapak tipinin fiyatına
 * gömülmez, yoksa kulp iki yerde fiyatlanırdı.
 */
export const DOOR_TYPES: IDoorType[] = [
  {
    id: 'standart',
    label: 'Standart kapak',
    pricePerM2: 0,
    includesHandle: true,
    render: { hasHandle: true },
  },
  {
    id: 'kulpsuz',
    label: 'Kulpsuz kapak',
    pricePerM2: 450,
    includesHandle: false,
    render: { hasHandle: false },
  },
  {
    id: 'aynali',
    label: 'Aynalı kapak',
    pricePerM2: 1200,
    includesHandle: true,
    render: { hasHandle: true, metalness: 0.9, roughness: 0.05 },
  },
  {
    id: 'cam',
    label: 'Cam kapak',
    pricePerM2: 1500,
    includesHandle: true,
    render: { hasHandle: true, transparent: true, opacity: 0.28, roughness: 0.1 },
  },
  {
    id: 'yok',
    label: 'Kapaksız',
    pricePerM2: 0,
    includesHandle: false,
    render: { hasHandle: false },
  },
];

/** Arkalık görünmez maliyet: dökümde satır açmaz, toplamda vardır. */
export const BACK_PANELS: IBackPanel[] = [
  { id: 4, label: '4 mm (standart)', pricePerM2: 180 },
  { id: 8, label: '8 mm', pricePerM2: 260 },
  { id: 18, label: '18 mm (tam gövde)', pricePerM2: 520 },
];
