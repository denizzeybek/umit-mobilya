/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
import type { IBaseConfig, IBaseSection } from '../../pricing/config';

/**
 * Gardırobun bölümünde ne olur: raf, askılık, çekmece. Vestiyerde oturak ve
 * açık askı, mutfakta tezgâh ve davlumbaz olacak — bu yüzden `IBaseSection`
 * yalnızca genişliği tanımlıyor, gerisi ürünün kendi işi.
 *
 * Raf ve askılık konumları TAVANDAN ölçülür (cm). Sebebi imalat: usta ölçüyü
 * tavandan alır, kullanıcı da panele gördüğü sayıyı yazar. Sahne üreticisi
 * bunu zeminden yüksekliğe kendi çevirir.
 */
export interface IGardiropSection extends IBaseSection {
  shelves: number[];
  rails: number[];
  drawers: number;
}

export interface IGardiropConfig extends IBaseConfig {
  sections: IGardiropSection[];
}
