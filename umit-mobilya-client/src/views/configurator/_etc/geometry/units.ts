import { PANEL_THICKNESS_CM } from '../catalog';

/**
 * Sahne santimetre değil METRE ile çalışır. Three.js'in varsayılan ışık
 * zayıflaması, gölge kamerası ve kırpma düzlemleri metre ölçeğine göre ayarlı;
 * santimetre kullanınca aydınlatma bozuluyor.
 *
 * Panel yerleşimi yapan her yer bu dosyadan geçmeli — dönüşümü kopyalayan
 * ikinci bir yer, ölçekleri birbirine karıştırmanın en kolay yolu.
 */
export const CM = 0.01;

/** Panel kalınlığı, metre. */
export const T = PANEL_THICKNESS_CM * CM;

export const toMeters = (centimeters: number): number => centimeters * CM;

/** Arkalık kalınlığı milimetre olarak saklanıyor. */
export const backThicknessOf = (millimeters: number): number =>
  millimeters * 0.001;
