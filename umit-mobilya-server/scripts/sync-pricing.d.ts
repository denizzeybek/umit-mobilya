/**
 * `sync-pricing.js` CommonJS olarak yazıldı çünkü `nest build`den ÖNCE
 * çalışması gerekiyor (derleyeceği dosyaları o üretiyor) ve aynı modülü jest
 * de import ediyor — spec'in test ettiği mantığı kopyalamaması için.
 */
export interface ISyncedFile {
  /** İstemcideki `_etc/` köküne göre yol. */
  from: string;
  /** Sunucudaki `src/configurator/generated/` köküne göre yol. */
  to: string;
}

export declare const HEADER: string;
export declare const collect: () => Promise<ISyncedFile[]>;
export declare const expectedContent: (from: string) => Promise<string>;
export declare const serverPath: (to: string) => string;

/**
 * İstemcideki `_etc/` kökünün mutlak yolu. Bildirilmişti ama tipte yoktu; ürün
 * eksiksizlik spec'i ürün listesini istemcinin KLASÖRLERİNDEN okuyor ve o yolu
 * ikinci kez yazmak, tam olarak bu testin yakalamak istediği ayrışmayı
 * üretirdi.
 */
export declare const CLIENT: string;

/** Sunucudaki `src/configurator/generated/` kökünün mutlak yolu. */
export declare const SERVER: string;
