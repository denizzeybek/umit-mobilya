/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
/**
 * Sahne santimetre değil METRE ile çalışır. Three.js'in varsayılan ışık
 * zayıflaması, gölge kamerası ve kırpma düzlemleri metre ölçeğine göre ayarlı;
 * santimetre kullanınca aydınlatma bozuluyor.
 */
export const CM = 0.01;

/**
 * Ölçü matematiğinin varsaydığı panel kalınlığı (cm).
 *
 * Gerçek kalınlık artık MALZEMENİN özelliği (`IMaterial.thicknessMm`) ve parça
 * listesi onu oradan okuyor. Buradaki sabit yalnızca bölüm genişliği
 * matematiğinin kullandığı varsayım: `sectionWidths` fiyat kitabını görmüyor,
 * çünkü ölçü aralığı hesabı katalogdan bağımsız olmalı.
 *
 * Tohumdaki her malzeme 18 mm olduğu için ikisi bugün örtüşüyor. Admin farklı
 * kalınlıkta bir malzeme eklerse burası da kitaptan beslenmeli.
 */
export const PANEL_THICKNESS_CM = 1.8;

/** Panel kalınlığı, metre. */
export const T = PANEL_THICKNESS_CM * CM;

/** Altına inildiğinde askılık ve çekmece imal edilemeyen pratik alt sınır. */
export const MIN_SECTION_WIDTH = 20;

export const toMeters = (centimeters: number): number => centimeters * CM;

/** Arkalık kalınlığı milimetre olarak saklanıyor. */
export const backThicknessOf = (millimeters: number): number =>
  millimeters * 0.001;
