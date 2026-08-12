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
