/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
import type {
  TBackPanel,
  TDoorTypeId,
  TFinishId,
  TMaterialId,
} from './types';

/**
 * Fiyat kitabı: admin panelinin düzenlediği her şey. Parça listesi "ne var",
 * fiyat kitabı "kaça" sorusunun cevabı. İkisi ayrı tutuluyor çünkü admin bir
 * rakam değiştirdiğinde parça listesinin yeniden üretilmesi gerekmiyor.
 *
 * Bu yapı sunucudaki Mongoose şemasının birebir karşılığı olacak (Faz 3).
 */

export type TAreaConvention = 'gross' | 'net';

export interface IMaterial {
  id: TMaterialId;
  label: string;
  /** Farklı kalınlık ayrı fiyat demek; anahtar (id, thicknessMm) çiftidir. */
  thicknessMm: number;
  pricePerM2: number;
  /** 3D görünümü. Fiyatla aynı seçimden türediği için aynı tabloda. */
  roughness: number;
  clearcoat: number;
  /** Seçim listesinden çıkarır ama kataloğdan SİLMEZ — eski config'ler için. */
  hidden?: boolean;
}

/**
 * Desen ölçeği verilmemişse varsayılan tekrar aralığı (cm).
 *
 * Burada, çünkü hem admin paneli (yeni desen yüklenince) hem 3B görüntüleyici
 * (ölçek boşsa) aynı sayıya ihtiyaç duyuyor. İki yerde yazıldığında biri
 * değişip diğeri kaldığında panel bir şey gösterip sahne başka bir şey
 * çiziyordu.
 */
export const DEFAULT_TEXTURE_SCALE_CM = 60;

export interface IFinish {
  id: TFinishId;
  label: string;
  color: number;
  swatch: string;
  /** Panel alanı üstünden ek ücret. Tohumda 0. */
  surchargePerM2: number;
  hidden?: boolean;
  /**
   * Desen görselinin R2 nesne ANAHTARI — URL değil. Kitapta saklanan budur;
   * ürün görselleriyle aynı kural, aynı sebeple: public alan adı ya da kova
   * değişirse kayıtlar taşınabilir kalsın.
   */
  textureName?: string;
  /**
   * Anahtardan okuma anında kurulan public URL. **Kitaba yazılmaz** —
   * `publish` bu alanı söküyor, yoksa ilk kaydetmede URL kalıcı hâle gelir ve
   * yukarıdaki kural sessizce delinir.
   */
  textureUrl?: string | null;
  /**
   * Desenin kaç santimetrede bir tekrarladığı. Ölçek olmadan aynı görsel
   * kapakta dev bir leke, yan panelde toz gibi çıkıyor — ceviz damarı ile
   * mermer aynı sayıyı istemiyor.
   */
  textureScaleCm?: number;
}

export interface IDoorTypeRender {
  hasHandle: boolean;
  transparent?: boolean;
  opacity?: number;
  metalness?: number;
  roughness?: number;
}

export interface IDoorType {
  id: TDoorTypeId;
  label: string;
  /** Tek fiyat modu var: kapak alanı üstünden ek ücret. */
  pricePerM2: number;
  /**
   * Kulp kalemini `partsOf` üretir, bu fiyata GÖMÜLMEZ — iki yerde
   * fiyatlanmasın diye.
   */
  includesHandle: boolean;
  render: IDoorTypeRender;
  hidden?: boolean;
}

export interface IBackPanel {
  id: TBackPanel;
  label: string;
  pricePerM2: number;
}

export interface IEdgeBand {
  pricePerM: number;
  /** `all` seçilirse parçanın `bandedEdgeM` alanı yok sayılır, çevre alınır. */
  appliedTo: 'visible' | 'all';
}

export interface IHingeStep {
  maxHeightCm: number;
  count: number;
}

export interface IHardware {
  hinge: { pricePerUnit: number; countByDoorHeight: IHingeStep[] };
  handle: { pricePerUnit: number };
  /** Ray ve malzeme bu fiyatın içinde — ayrı kalem yok. */
  drawer: { pricePerUnit: number };
  rail: { pricePerM: number };
}

export type TLabourMethod = 'perM2' | 'perHour' | 'percentOfMaterial';

export interface ILabour {
  method: TLabourMethod;
  perM2?: number;
  hourlyRate?: number;
  hoursPerM2?: number;
  percentOfMaterial?: number;
  /** Her yöntemde geçerli, opsiyonel. */
  assemblyFlat?: number;
}

export interface IRangeLimit {
  min: number;
  max: number;
  step: number;
}

export interface IProductSettings {
  width: IRangeLimit;
  height: IRangeLimit;
  depth: IRangeLimit;
  sectionCount: { min: number; max: number };
  /** Tek modülün dış genişlik tavanı. Üstüne çıkan ölçü modüle bölünür. */
  maxModuleWidthCm: number;
  /**
   * Tek kapak kanadının genişlik tavanı. 200 cm'lik bir modüle tek kanat
   * takılamaz — sarkar, menteşe taşımaz. Kanat sayısı bundan çıkar ve
   * menteşe/kulp/kenar bandı adedini doğrudan belirler.
   */
  maxDoorLeafWidthCm: number;
  defaultMaterial: TMaterialId;
  defaultDoorType: TDoorTypeId;
}

export interface IPriceBook {
  version: number;
  currency: 'TRY';
  materials: IMaterial[];
  finishes: IFinish[];
  doorTypes: IDoorType[];
  backPanels: IBackPanel[];
  edgeBand: IEdgeBand;
  hardware: IHardware;
  labour: ILabour;
  delivery: { enabled: boolean; label: string; flat: number };
  /** Müşteriye satır olarak GÖSTERİLMEZ, toplama gömülür. */
  margin: { multiplier: number };
  vat: { rate: number; included: boolean };
  /** Fire payı; `net` konvansiyonunda zayiatı geri koymanın dürüst yolu. */
  waste: { percent: number };
  areaConvention: TAreaConvention;
  products: Record<string, IProductSettings>;
}

export interface IPriceLine {
  label: string;
  amount: number;
}

export interface IPriceBreakdown {
  /** Müşteriye gösterilecek kalemler; gizli olanlar burada YOKTUR. */
  lines: IPriceLine[];
  /** Marj ve KDV dahil, KDV öncesi tutar (gizli kalemler dahil). */
  netTotal: number;
  vat: number;
  total: number;
}
