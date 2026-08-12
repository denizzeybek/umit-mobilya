import type { IPriceBreakdown } from './price/shared';
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

export type TMaterialId = 'suntalam' | 'mdf-lam' | 'lak' | 'mdf-gloss';
export type TFinishId = 'beyaz' | 'antrasit' | 'mese' | 'ceviz';
export type TDoorStyle = 'kulplu' | 'kulpsuz' | 'yok';
export type TBackPanel = 4 | 8 | 18;

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
}

/** Her ürünün bölümünde bulunan tek ortak alan. */
export interface IBaseSection {
  width: number;
}

export interface IBaseConfig {
  width: number;
  height: number;
  depth: number;
  sectionCount: number;
  material: TMaterialId;
  finish: TFinishId;
  backPanel: TBackPanel;
  doorStyle: TDoorStyle;
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
 * `fields` ürüne özel panel bölümlerini çizen bileşen — gardıropta raf/askılık,
 * mutfakta tezgâh/davlumbaz olacak.
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
   * raflı, vestiyerde oturaklı. Paylaşılan bölüm sayısı denetimi bunu tanımdan
   * alır, yoksa ürünü tanımak zorunda kalırdı.
   */
  createSection: (width: number) => IBaseSection;
  build: (config: IBaseConfig) => IProductBuild;
  price: (config: IBaseConfig) => IPriceBreakdown;
  fields: Component;
}
