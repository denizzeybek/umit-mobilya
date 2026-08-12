/**
 * Kaplama rengi iki biçimde birden yaşıyor ve ikisi de gerekli:
 *
 * - `color: number` (0xedeae4) → doğrudan Three.js malzemesine gidiyor
 * - `swatch: string` ('#EDEAE4') → panelde ve admin tablosunda gösteriliyor
 *
 * İkisi ayrışırsa 3B'deki dolap panelde seçilenden başka renkte çıkar ve
 * hiçbir şey ötmez. O yüzden dönüşüm tek yerde ve test edilmiş.
 *
 * PrimeVue `ColorPicker` `format="hex"` ile `#` OLMADAN döndürüyor; kullanıcı
 * elle `#` ile de yazabiliyor. İkisi de kabul ediliyor.
 */
const HEX = /^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** `0xedeae4` → `'#EDEAE4'`. Geçersiz sayı siyaha düşer, patlamaz. */
export const toSwatch = (color: number): string => {
  if (!Number.isFinite(color) || color < 0) return '#000000';

  const clamped = Math.min(Math.round(color), 0xffffff);
  return `#${clamped.toString(16).padStart(6, '0').toUpperCase()}`;
};

/**
 * `'#EDEAE4'` | `'edeae4'` | `'#eea'` → `0xedeae4`.
 *
 * Okunamayan bir değer için `null` döner, 0 DEĞİL: siyah geçerli bir renk ve
 * "anlaşılmadı"yı siyaha çevirmek, yazım hatasını sessizce kaplamaya
 * dönüştürürdü.
 */
export const toColorNumber = (hex: string): number | null => {
  const trimmed = hex.trim();
  if (!HEX.test(trimmed)) return null;

  const digits = trimmed.replace('#', '');
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits;

  return Number.parseInt(full, 16);
};

/**
 * Yeni kaplamanın kimliği.
 *
 * Kimlik ETİKETTEN TÜRETİLMİYOR: `id` bir kimlik, etiket bir metin. Etiketten
 * türetilseydi admin "Antrasit"i "Koyu Gri" yapınca kimlik de değişmek ister,
 * ama o kimlik paylaşılmış bağlantılarda ve dondurulmuş tekliflerde duruyor —
 * değişirse ikisi de çözümsüz kalır.
 */
export const nextCustomFinishId = (taken: readonly string[]): string => {
  const used = new Set(taken);

  let index = 1;
  while (used.has(`ozel-${index}`)) index += 1;

  return `ozel-${index}`;
};
