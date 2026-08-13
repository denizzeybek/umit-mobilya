import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Kovasız geliştirme için disk deposu — R2'nin yerine geçen **yalnızca yerel**
 * yedek.
 *
 * Neden var: R2 kimlik bilgisi olmayan biri görsel yükleyemiyor, dolayısıyla
 * kaplama deseni gibi bir özelliği ne geliştirebiliyor ne görebiliyordu.
 *
 * Neden yalnızca yerel: Railway'in dosya sistemi geçici. Canlıda bu yol açık
 * olsaydı yüklemeler çalışıyormuş gibi görünüp deploy'da sessizce buharlaşırdı
 * — kaybı fark edilmeyen tek hata türü. Seçim `ObjectStorageService` içinde
 * yapılıyor ve `production` bu yolu hiç göremiyor.
 *
 * R2'de olmayan üç sorumluluk buraya düşüyor ve üçü de burada:
 * anahtar güvenliği (R2'de anahtar bir yol değil, diskte bir DOSYA YOLU),
 * içerik tipi (R2 nesne metaverisinde tutar, dosya sistemi tutmaz) ve silme.
 */

/**
 * `buildKey`in ürettiği biçim: `[\w.-]+`. Kabul edilen küme bilerek DAR —
 * anahtar `GET /api/storage/:key` üzerinden kullanıcıdan geliyor ve doğrudan
 * dosya yoluna çevriliyor. Eğik çizgi, ters eğik çizgi ve `..` yok; kodlanmış
 * hâlleri de (`%2F`) bu kümeye uymadığı için elenir.
 */
const SAFE_KEY = /^[\w.-]+$/;

export const isSafeKey = (key: string): boolean =>
  SAFE_KEY.test(key) && !key.includes('..');

/** Sihirli baytlar; anahtarda uzantı olmadığı için tip başka türlü bilinemiyor. */
const SIGNATURES: { bytes: number[]; type: string }[] = [
  { bytes: [0xff, 0xd8, 0xff], type: 'image/jpeg' },
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], type: 'image/png' },
  { bytes: [0x47, 0x49, 0x46, 0x38], type: 'image/gif' },
];

export const contentTypeOf = (buffer: Buffer): string => {
  for (const { bytes, type } of SIGNATURES) {
    if (bytes.every((byte, index) => buffer[index] === byte)) return type;
  }

  /* WEBP: "RIFF" + 4 bayt uzunluk + "WEBP". */
  if (
    buffer.length >= 12 &&
    buffer.toString('binary', 0, 4) === 'RIFF' &&
    buffer.toString('binary', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  /*
   * Tanınmayan içeriğe `image/*` demek, tarayıcının olmayan bir görseli
   * çizmeye çalışıp sessiz bir boşluk bırakması demekti.
   */
  return 'application/octet-stream';
};

export interface IStoredObject {
  body: Buffer;
  contentType: string;
}

export class LocalDiskStorage {
  constructor(private readonly root: string) {}

  private pathOf(key: string): string | null {
    return isSafeKey(key) ? join(this.root, key) : null;
  }

  async put(key: string, body: Buffer): Promise<void> {
    const path = this.pathOf(key);
    if (!path) throw new Error(`Güvensiz anahtar: ${key}`);

    await mkdir(this.root, { recursive: true });
    await writeFile(path, body);
  }

  /** Bulunamayan ya da güvensiz anahtar için `null` — ayrım çağırana kalmaz. */
  async read(key: string): Promise<IStoredObject | null> {
    const path = this.pathOf(key);
    if (!path) return null;

    const body = await readFile(path).catch(() => null);
    if (!body) return null;

    return { body, contentType: contentTypeOf(body) };
  }

  async remove(key: string): Promise<void> {
    const path = this.pathOf(key);
    if (!path) return;

    await rm(path, { force: true });
  }
}
