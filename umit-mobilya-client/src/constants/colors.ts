/*
 * Tek kaynak: tailwind.config.js bunu `colors`, `textColor` ve `borderColor`
 * içine yayıyor, plugins/primeVue/flexytheme.ts de aynı değerleri okuyor.
 * Burayı değiştirmek her iki tema sistemini birden değiştirir.
 *
 * Palet ısmarlama marangozluktan geliyor: kağıt gibi sıcak nötr zeminler,
 * tek derin aksan (koyu yeşil), ölçülü bir metal vurgusu (pirinç).
 * Tüm metin/zemin çiftleri WCAG AA (>=4.5) geçer — f-brass-light yalnızca
 * f-primary üstünde, f-brass yalnızca açık zeminlerde okunur.
 */
export const colors = {
  'f-primary': '#2E3A32',
  'f-primary-hovered': '#212B24',
  'f-brass': '#836434',
  'f-brass-light': '#C9A76B',

  'f-bone': '#F4F0E8',
  'f-paper': '#FBF8F2',
  'f-linen': '#EAE4D9',
  'f-white': '#ffffff',

  'f-ink': '#1C1A16',
  'f-ink-muted': '#6B6459',
  'f-ink-faint': '#736B5E',

  'f-rule': '#DDD5C7',
  'f-rule-strong': '#C6BCA9',

  'f-success': '#3F6B4A',
  'f-danger': '#A33B32',
  'f-warn': '#9A6B23',
  'f-info': '#3B5F73',
  'f-light-red': '#F6E8E6',
  'f-light-green': '#E8F0E9',
  'f-light-yellow': '#F7EFE1',

  /*
   * Yönetim arayüzünün eski adları, yeni palete eşlendi ki form/modal/tablo
   * tarafı bozulmasın. Yeni kodda yukarıdaki adlar kullanılmalı.
   */
  'f-secondary': '#6B6459',
  'f-stroke': '#DDD5C7',
  'f-off-white': '#FBF8F2',
  'f-black': '#1C1A16',
  'f-light-black': '#6B6459',
  'f-gray': '#C6BCA9',
  'f-light-gray': '#EAE4D9',
  'f-dark-gray': '#736B5E',
  'f-text-gray': '#9A9184',
  'f-body-bg': '#F4F0E8',
};
