import request from 'supertest';

import { createTestApp } from '../create-test-app';
import {
  clearCollections,
  connectTestMongo,
  disconnectTestMongo,
} from '../mongo-memory';

import type { INestApplication } from '@nestjs/common';

/**
 * Hız sınırının GERÇEKTEN uygulandığı.
 *
 * Bu spec kırmızı yazıldı ve kırmızı koştu: `ThrottlerModule.forRoot()`
 * çağrılmış ve `POST /api/quotes` üstünde `@Throttle({ limit: 5 })` duruyordu
 * ama `ThrottlerGuard` hiçbir yere kayıtlı değildi. Dekoratör atıldı, sınır
 * hiç uygulanmadı: altıncı istek de 201 aldı.
 *
 * Sessiz kalması bu yüzden pahalı: `quote.controller.ts` yorumu teklif ucunun
 * public olmasını "dakikada 5 istek" korumasına dayandırıyor. Koruma yoksa
 * gerekçe de yok — herkese açık bir uç, sınırsız yazma demekti.
 *
 * `enforceRateLimit: true` bilinçli: sınır varsayılan olarak testlerde kapalı
 * (bkz. `create-test-app.ts`), ve sınırın kendisini doğrulayan tek yer burası.
 */
describe('hız sınırı', () => {
  let app: INestApplication;

  const CONTACT = { name: 'Hız Sınırı', phone: '0500 000 00 00' };

  const config = async (): Promise<Record<string, unknown>> => {
    const response = await request(app.getHttpServer()).get('/api/pricebook');
    const book = response.body.data;
    const settings = book.products.gardirop;

    return {
      width: 180,
      height: 220,
      depth: 60,
      sectionCount: 2,
      material: settings.defaultMaterial,
      finish: book.finishes[0].id,
      backPanel: book.backPanels[0].id,
      doorType: settings.defaultDoorType,
      doorOpen: 0,
      sections: [
        { width: 86.4, shelves: [35, 120], rails: [42], drawers: 0 },
        { width: 86.4, shelves: [35, 120], rails: [42], drawers: 0 },
      ],
    };
  };

  const postQuote = async (): Promise<number> => {
    const response = await request(app.getHttpServer())
      .post('/api/quotes')
      .send({ productType: 'gardirop', config: await config(), contact: CONTACT });

    return response.status;
  };

  beforeAll(async () => {
    await connectTestMongo();
    app = await createTestApp({ enforceRateLimit: true });
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestMongo();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  /*
   * Pencere dakikalık ve sayaç uygulama ömrü boyunca yaşıyor, o yüzden tek bir
   * `it` içinde ölçülüyor: ikinci bir test aynı kovayı devralır ve sırasına
   * göre farklı sonuç verirdi.
   */
  it('altıncı teklif isteği 429 alır, beşincisi hâlâ 201', async () => {
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
      statuses.push(await postQuote());
    }

    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses[5]).toBe(429);
  });

  /* Okuma ucu aynı hacimde sınırlanmıyor — genel tavan çok daha yüksek. */
  it('katalog okuması aynı hacimde sınırlanmaz', async () => {
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(app.getHttpServer()).get('/api/pricebook');
      statuses.push(response.status);
    }

    expect(statuses.every((status) => status === 200)).toBe(true);
  });
});
