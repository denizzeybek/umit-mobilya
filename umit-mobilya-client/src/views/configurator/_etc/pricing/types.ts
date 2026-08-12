/**
 * Parça listesi (BOM) sözleşmesi. Konfigüratörün omurgası burası: tek bir
 * `partsOf(config)` listeyi üretir, 3D onu mesh'e çevirir, fiyat onu paraya.
 *
 * Neden: bugüne kadar iki ayrı hesap vardı ve farklı şeyler anlatıyorlardı.
 * Geometri gövdeyi 2 yan + üst + alt + bölmeler olarak çiziyor, fiyat ise
 * `2hd + 2wd + (n-1)hd` gibi tek bir formülle hesaplıyordu; kapak `(h/2.2)`,
 * raf `(genişlik/90)` gibi hiçbir imalat gerçeğine karşılık gelmeyen
 * çarpanlar taşıyordu. Kullanıcının ekranda gördüğü dolapla fiyatı hesaplanan
 * dolap aynı şey değildi — ve bu sessizce böyleydi.
 *
 * Tek liste ikisini de beslediği için ayrışmaları tanım gereği imkânsız.
 */

/**
 * Katalog kimlikleri derleme zamanında KAPALI DEĞİL: admin paneli listeye
 * yeni malzeme ekleyebilecek, bu yüzden birleşim tipi olarak tutulamazlar.
 * Kaybedilen derleme-zamanı güvencesi çalışma zamanına taşınıyor —
 * `sanitizeConfig` bilinmeyen kimliği reddediyor, `priceOf` ise hata veriyor.
 */
export type TMaterialId = string;
export type TFinishId = string;
export type TDoorTypeId = string;
export type TBackPanel = number;

export type TPartKind =
  | 'yan-panel'
  | 'ust'
  | 'alt'
  | 'arkalik'
  | 'kapak'
  | 'raf'
  | 'cekmece'
  | 'kulp'
  | 'mentese'
  | 'askilik';

/**
 * Fiyatın hangi yoldan hesaplanacağı. `panel` m² üstünden, `hardware` adet
 * ya da metre üstünden. Çekmece bilerek `hardware`: birim fiyatı rayı ve
 * malzemeyi zaten içeriyor, ön panelini ayrıca m² fiyatlamak aynı çekmeceyi
 * iki kez saymak olurdu.
 */
export type TPartClass = 'panel' | 'hardware';

export type TMaterialRole = 'carcass' | 'door' | 'back';

/** Santimetre. Panelin ince ekseni kalınlıktır; alan en büyük iki eksenden. */
export interface IPartSize {
  w: number;
  h: number;
  d: number;
}

/** Sahnedeki yer, METRE — 3D kullanır, fiyat kullanmaz. */
export interface IPartPlacement {
  x: number;
  y: number;
  z: number;
}

export interface IPart {
  kind: TPartKind;
  partClass: TPartClass;
  /** Hangi modüle ait. Modül başına fiyatlandırma bunun üstünde çalışır. */
  moduleIndex: number;
  materialRole?: TMaterialRole;
  /** Gerçek kesim ölçüsü. 3D bunu çizer. */
  size?: IPartSize;
  /**
   * Modülün dış ölçüsüne oturtulmuş hali. Atölye brüt hesaplıyor: 60 cm
   * genişliğinde bir modülün üst paneli 56.4 x 60 kesiliyor ama 60 x 60
   * fiyatlanıyor. Hangisinin kullanılacağını fiyat kitabı söyler.
   */
  grossSize?: IPartSize;
  placement?: IPartPlacement;
  qty: number;
  /** Görünen kenar bandı metrajı (m). `appliedTo: 'all'` bunu yok sayar. */
  bandedEdgeM?: number;
  /** Askılık borusu gibi metrajla fiyatlanan donanımın uzunluğu (m). */
  lengthM?: number;
  /** Müşteriye gösterilen dökümde satır açmaz, toplamda vardır. */
  hidden?: boolean;
  /** Dökümde bu etiket altında toplanır. */
  label: string;
}
