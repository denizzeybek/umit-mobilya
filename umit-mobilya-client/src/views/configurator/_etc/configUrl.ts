import type { EProductType, IBaseConfig } from './types';

/**
 * Tasarımın adres çubuğundaki hali. Konfigüratör bugüne kadar kurulumu
 * kaybediyordu: kullanıcı on dakika tasarlayıp "Teklif Al"a basıyor, karşı
 * tarafa hiçbir şey gitmiyordu. Config'i URL'e kodlamak hem paylaşmayı hem
 * teklife iliştirmeyi tek mekanizmayla çözüyor.
 *
 * Bu dosya ÜRÜN BİLMEZ ve şekil doğrulaması yapmaz — yalnızca metni taşır.
 * Gelen gövdenin anlamlı bir config olup olmadığı `sanitizeConfig.ts`'in işi.
 */

/**
 * Şema sürümü. `IBaseConfig` alanları değiştiğinde artırılır ve o sürüm için
 * bir `migrate` yazılır. Migrate yoksa bağlantı okunmaz — paylaşılmış bir
 * bağlantının sessizce YANLIŞ dolap açması, hiç açmamasından kötü.
 */
export const CONFIG_SCHEMA_VERSION = 1;

/** Adres çubuğunda tasarımı taşıyan sorgu parametresi. */
export const CONFIG_QUERY_KEY = 'c';

export interface IEncodedConfig {
  v: number;
  /**
   * Ürün kimliği. `EProductType` değil `string`: gövde kullanıcıdan geliyor ve
   * geçerli bir üye olduğunu iddia etmek doğrulamadan önce yalan olurdu.
   * Çağıran, gösterdiği ürünün kimliğiyle karşılaştırır.
   */
  t: string;
  /** Doğrulanmamış config gövdesi. */
  c: unknown;
}

const toBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const fromBase64Url = (raw: string): string | null => {
  const normalised = raw.replace(/-/g, '+').replace(/_/g, '/');
  const remainder = normalised.length % 4;
  const padded = remainder
    ? normalised + '='.repeat(4 - remainder)
    : normalised;

  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
};

/**
 * Base64url, düz base64 değil: `+` ve `/` bir sorgu dizesinde kaçış gerektirir,
 * `=` dolgusu da öyle. Tipik bir gardırop config'i ~380 bayt JSON, ~510
 * karakter kod — URL sınırından uzak, bu yüzden sıkıştırma yok.
 */
export const encodeConfig = (
  type: EProductType,
  config: IBaseConfig,
): string => {
  const payload: IEncodedConfig = {
    v: CONFIG_SCHEMA_VERSION,
    t: type,
    c: config,
  };

  return toBase64Url(JSON.stringify(payload));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * ASLA `throw` etmez. Bozuk, elle kurcalanmış ya da eski sürümlü bir bağlantı
 * `null` döner ve çağıran varsayılan tasarıma düşer — adres çubuğuna yazılan
 * bir şey uygulamayı beyaz ekrana götüremez.
 */
export const decodeConfig = (raw: unknown): IEncodedConfig | null => {
  if (typeof raw !== 'string' || raw.length === 0) return null;

  const json = fromBase64Url(raw);
  if (json === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  if (parsed.v !== CONFIG_SCHEMA_VERSION) return null;
  if (typeof parsed.t !== 'string' || parsed.t.length === 0) return null;
  if (!isRecord(parsed.c)) return null;

  return { v: parsed.v, t: parsed.t, c: parsed.c };
};
