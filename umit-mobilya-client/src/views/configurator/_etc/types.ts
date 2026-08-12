import type { IPriceBook, IProductSettings } from './pricing/priceBook';
import type {
  IPart,
  TBackPanel,
  TDoorTypeId,
  TFinishId,
  TMaterialId,
} from './pricing/types';
import type { Group, Object3D } from 'three';
import type { Component } from 'vue';

/**
 * Ürün tiplerinin ortak sözleşmesi. Buradaki hiçbir tip tek bir ürüne ait
 * değil — gardırop, vestiyer ve mutfak aynı arayüzü doldurur.
 */
export enum EProductType {
  Gardirop = 'gardirop',
  Vestiyer = 'vestiyer',
}

export type { TBackPanel, TDoorTypeId, TFinishId, TMaterialId };

/** Bir ölçünün izin verilen aralığı ve panel adımı. */
export interface IRange {
  min: number;
  max: number;
  step: number;
}

/**
 * Ölçü sınırları ürüne göre değişir — gardırop 160–280 cm yüksekliğinde,
 * mutfak alt dolabı 85 cm. Bu yüzden paylaşılan geometri kodu sınırları
 * import ETMEZ, parametre olarak alır.
 */
export interface IProductLimits {
  width: IRange;
  height: IRange;
  depth: IRange;
  sectionCount: { min: number; max: number };
  maxModuleWidthCm: number;
  maxDoorLeafWidthCm: number;
}

export const limitsOf = (settings: IProductSettings): IProductLimits => ({
  width: settings.width,
  height: settings.height,
  depth: settings.depth,
  sectionCount: settings.sectionCount,
  maxModuleWidthCm: settings.maxModuleWidthCm,
  maxDoorLeafWidthCm: settings.maxDoorLeafWidthCm,
});

/** Her ürünün bölümünde bulunan tek ortak alan. */
export interface IBaseSection {
  width: number;
}

export interface IBaseConfig {
  width: number;
  height: number;
  depth: number;
  sectionCount: number;
  /** Gövde ve kapak panellerinin ikisini birden fiyatlar. */
  material: TMaterialId;
  finish: TFinishId;
  backPanel: TBackPanel;
  /** Malzemeden bağımsız ikinci eksen: standart, kulpsuz, aynalı, cam. */
  doorType: TDoorTypeId;
  doorOpen: number;
  sections: IBaseSection[];
}

export interface IProductBuild {
  group: Group;
  doorPivots: { pivot: Object3D; hinge: 'left' | 'right' }[];
  dispose: () => void;
}

/**
 * Bir ürün tipinin tamamı. `registry.ts` bunları tek tabloda tutar;
 * `Configurator.vue` hangi ürünü gösterdiğini bilmeden çalışır.
 *
 * Ürünler artık `build` ve `price` DEĞİL yalnızca `parts` bildiriyor: tek bir
 * parça listesi hem sahneyi hem fiyatı besliyor, böylece ikisinin ayrışması
 * imkânsız. Mesh üretimi `geometry/buildFromParts`, fiyat `pricing/priceOf` —
 * ikisi de ürün bilmiyor.
 */
export interface IProductDefinition {
  id: EProductType;
  label: string;
  eyebrow: string;
  headline: string;
  lede: string;
  limits: IProductLimits;
  createDefault: () => IBaseConfig;
  /**
   * Yeni bir bölüm eklendiğinde nasıl doldurulacağını ürün bilir — gardıropta
   * raflı, vestiyerde oturaklı.
   */
  createSection: (width: number) => IBaseSection;
  parts: (config: IBaseConfig, book: IPriceBook) => IPart[];
  fields: Component;
}
