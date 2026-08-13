import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { contentTypeOf, isSafeKey, LocalDiskStorage } from './local-disk.storage';

/**
 * Kovasız geliştirme için disk deposu.
 *
 * Okuma yolu burada çiviliyor, çünkü R2'de olmayan üç sorumluluk bu tarafa
 * geçiyor: anahtarın güvenliği (R2'de anahtar bir yol değil, burada bir DOSYA
 * YOLU), içerik tipi (R2 nesne metaverisinde tutuyor, diskte tutmuyor) ve
 * yaşam süresi.
 */
describe('isSafeKey', () => {
  /*
   * Anahtar `GET /api/storage/:key` üzerinden KULLANICIDAN geliyor. Doğrudan
   * dosya yoluna çevrilirse `../../.env` okunabilir hâle gelir — bu modülün
   * en pahalı hatası bu olurdu.
   */
  it('yol kaçışını reddeder', () => {
    expect(isSafeKey('../.env')).toBe(false);
    expect(isSafeKey('..')).toBe(false);
    expect(isSafeKey('alt/klasor')).toBe(false);
    expect(isSafeKey('/mutlak')).toBe(false);
    expect(isSafeKey('a\\b')).toBe(false);
    expect(isSafeKey('')).toBe(false);
  });

  /* `buildKey`in ürettiği biçim geçerli olmalı, yoksa hiçbir görsel okunmaz. */
  it('üretilen anahtar biçimini kabul eder', () => {
    expect(isSafeKey('ceviz-damar-a1b2c3')).toBe(true);
    expect(isSafeKey('image-0f9e.jpg')).toBe(true);
  });
});

describe('contentTypeOf', () => {
  /*
   * Anahtarda uzantı YOK (`buildKey` gövdeyi slug'layıp rastgele son ek
   * ekliyor), yani tip dosya adından okunamıyor. Sihirli baytlar tek
   * kendine yeten kaynak: yanında ikinci bir dosya tutmak, senkronu bozulacak
   * bir durum daha yaratırdı.
   */
  it('JPEG, PNG, WEBP ve GIF ayırt eder', () => {
    expect(contentTypeOf(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(
      contentTypeOf(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe('image/png');
    expect(contentTypeOf(Buffer.from('RIFF....WEBPVP8 ', 'binary'))).toBe('image/webp');
    expect(contentTypeOf(Buffer.from('GIF89a', 'binary'))).toBe('image/gif');
  });

  /*
   * Tanınmayan içerik `image/*` DEĞİL: tarayıcıya "bu bir görsel" demek,
   * olmadığı hâlde çizmeye çalışmasına ve sessiz bir boşluğa yol açardı.
   */
  it('tanımadığını görsel diye etiketlemez', () => {
    expect(contentTypeOf(Buffer.from('düpedüz metin'))).toBe(
      'application/octet-stream',
    );
    expect(contentTypeOf(Buffer.alloc(0))).toBe('application/octet-stream');
  });
});

describe('LocalDiskStorage', () => {
  let root: string;
  let storage: LocalDiskStorage;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'umb-storage-'));
    storage = new LocalDiskStorage(root);
  });

  it('yazdığını geri okur ve tipini söyler', async () => {
    const body = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x01, 0x02]);

    await storage.put('ceviz-abc123', body);
    const found = await storage.read('ceviz-abc123');

    expect(found?.body).toEqual(body);
    expect(found?.contentType).toBe('image/jpeg');
  });

  it('olmayan anahtar için null döner', async () => {
    expect(await storage.read('yok-boyle-bir-sey')).toBeNull();
  });

  /* Güvenlik kontrolü depoya GÖMÜLÜ, çağıranın hatırlamasına bırakılmıyor. */
  it('güvensiz anahtarı okumaz ve yazmaz', async () => {
    await expect(storage.put('../kacak', Buffer.from('x'))).rejects.toThrow(
      /anahtar/i,
    );
    expect(await storage.read('../.env')).toBeNull();

    expect(await readdir(root)).toEqual([]);
  });

  it('siler ve olmayanı silmek patlamaz', async () => {
    await storage.put('gidecek-abc', Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    await storage.remove('gidecek-abc');

    expect(await storage.read('gidecek-abc')).toBeNull();
    await expect(storage.remove('hic-olmayan')).resolves.toBeUndefined();
  });

  /* Kökün dışındaki bir dosya, sembolik bir isimle bile okunamamalı. */
  it('kök dışını okumaz', async () => {
    const outside = join(root, '..', 'umb-disarida.txt');
    await writeFile(outside, 'gizli');

    expect(await storage.read('..%2Fumb-disarida.txt')).toBeNull();
  });
});
