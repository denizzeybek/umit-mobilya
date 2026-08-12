import { describe, expect, it } from 'vitest';

import { createDefaultConfig } from './products/gardirop/options';
import {
  CONFIG_SCHEMA_VERSION,
  decodeConfig,
  encodeConfig,
} from './configUrl';
import { EProductType } from './types';

const encoded = () =>
  encodeConfig(EProductType.Gardirop, createDefaultConfig());

/**
 * Gövde base64url'e çevrildikten sonra JSON'a geri döner; ara adımı elle
 * kurmak yerine kodlayıcının kendi çıktısı üzerinde oynanıyor.
 */
const tamper = (payload: unknown): string => {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

describe('encodeConfig', () => {
  it('gidip gelen config alan alan aynı kalır', () => {
    const config = createDefaultConfig();

    const result = decodeConfig(encodeConfig(EProductType.Gardirop, config));

    expect(result?.c).toEqual(config);
  });

  it('ürün kimliğini ve şema sürümünü taşır', () => {
    const result = decodeConfig(encoded());

    expect(result?.t).toBe(EProductType.Gardirop);
    expect(result?.v).toBe(CONFIG_SCHEMA_VERSION);
  });

  it('URL kaçışı gerektiren karakter üretmez', () => {
    expect(encoded()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

});

describe('decodeConfig', () => {
  it('geçersiz base64 için null döner', () => {
    expect(decodeConfig('bu-base64-degil!!')).toBeNull();
  });

  it('base64 olan ama JSON olmayan gövde için null döner', () => {
    expect(decodeConfig(btoa('merhaba'))).toBeNull();
  });

  it('boş ve dize olmayan girdi için null döner', () => {
    expect(decodeConfig('')).toBeNull();
    expect(decodeConfig(undefined)).toBeNull();
    expect(decodeConfig(null)).toBeNull();
    expect(decodeConfig(42)).toBeNull();
  });

  it('bilinmeyen şema sürümü için null döner', () => {
    expect(
      decodeConfig(tamper({ v: 0, t: 'gardirop', c: {} })),
    ).toBeNull();
    expect(
      decodeConfig(tamper({ v: CONFIG_SCHEMA_VERSION + 1, t: 'gardirop', c: {} })),
    ).toBeNull();
  });

  it('ürün kimliği eksik ya da boşsa null döner', () => {
    expect(decodeConfig(tamper({ v: 1, t: '', c: {} }))).toBeNull();
    expect(decodeConfig(tamper({ v: 1, c: {} }))).toBeNull();
  });

  it('config gövdesi nesne değilse null döner', () => {
    expect(decodeConfig(tamper({ v: 1, t: 'gardirop', c: [] }))).toBeNull();
    expect(decodeConfig(tamper({ v: 1, t: 'gardirop', c: 'x' }))).toBeNull();
    expect(decodeConfig(tamper({ v: 1, t: 'gardirop' }))).toBeNull();
  });

  it('JSON dizisi gövdesi için null döner', () => {
    expect(decodeConfig(tamper([1, 2, 3]))).toBeNull();
  });

  /*
   * `btoa` ham UTF-16'da patlar, o yüzden gövde TextEncoder/TextDecoder'dan
   * geçiyor. Bugünkü config alanlarının hiçbiri serbest metin taşımıyor —
   * bu test o gün geldiğinde (teklif notu, ürün metni) kodlamanın hazır
   * olduğunu ve TextDecoder adımının kaldırılamayacağını sabitliyor.
   */
  it('çok baytlı karakter taşıyan gövde bozulmadan çözülür', () => {
    const payload = { v: CONFIG_SCHEMA_VERSION, t: 'gardirop', c: { not: 'ĞÜŞİÖÇ ğüşıöç' } };

    expect(decodeConfig(tamper(payload))?.c).toEqual({ not: 'ĞÜŞİÖÇ ğüşıöç' });
  });
});
