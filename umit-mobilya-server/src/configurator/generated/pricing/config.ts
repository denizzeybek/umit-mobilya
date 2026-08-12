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
 * Kullanıcının kurduğu tasarım. Bu dosya `pricing/` altında çünkü fiyat motoru
 * SUNUCUDA da çalışıyor: teklif kaydedilirken tutar yeniden hesaplanıyor ve
 * istemcinin gönderdiği rakama güvenilmiyor.
 *
 * Buradaki hiçbir şey Vue ya da Three.js bilmez — bilseydi `pricing/` ağacı
 * sunucuda derlenmezdi. Sahne ve panel tipleri `_etc/types.ts`'te kalıyor.
 */

/**
 * Her ürünün bölümünde bulunan ortak alanlar.
 *
 * `doorLeaves` bilerek `null` olabiliyor: OTOMATİK demek, yani kanat sayısı
 * modül genişliğinden ve kanat tavanından hesaplanır. Bir sayı verildiğinde
 * kullanıcının kararı geçerli olur — atölye bazen tavanı bilerek zorluyor ya
 * da simetri için farklı bölüyor, ve bunu koda gömmek yanlış olurdu.
 */
export interface IBaseSection {
  width: number;
  doorLeaves?: number | null;
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

/** Fiyatın kataloğa bağlanan tarafı — `priceOf`un ihtiyaç duyduğu tek şey. */
export interface ISelection {
  material: TMaterialId;
  finish: TFinishId;
  doorType: TDoorTypeId;
  backPanel: TBackPanel;
}

export const selectionOf = (config: IBaseConfig): ISelection => ({
  material: config.material,
  finish: config.finish,
  doorType: config.doorType,
  backPanel: config.backPanel,
});
