import request from 'supertest';

import { createTestApp, signTestToken } from '../create-test-app';
import {
  clearCollections,
  connectTestMongo,
  disconnectTestMongo,
} from '../mongo-memory';

import type { INestApplication } from '@nestjs/common';

/**
 * Teklif ve fiyat kitabı uçlarının HTTP sözleşmesi.
 *
 * Bu suite'in koruduğu iki şey diğer testlerin göremediği:
 * hangi ucun auth istediği, ve public cevabın ne TAŞIMADIĞI. İkisi de
 * arayüzde değil ağda yaşıyor.
 */
describe('quote + pricebook HTTP sözleşmesi', () => {
  let app: INestApplication;
  let token: string;

  const CONTACT = { name: 'Deniz Zeybek', phone: '0549 676 21 08' };

  const config = async () => {
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

  const createQuote = async () =>
    request(app.getHttpServer())
      .post('/api/quotes')
      .send({ productType: 'gardirop', config: await config(), contact: CONTACT });

  beforeAll(async () => {
    await connectTestMongo();
    app = await createTestApp();
    token = signTestToken();
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestMongo();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  describe('GET /api/pricebook', () => {
    it('auth istemez ve kataloğu döner', async () => {
      const response = await request(app.getHttpServer()).get('/api/pricebook');

      expect(response.status).toBe(200);
      expect(response.body.data.materials.length).toBeGreaterThan(0);
      expect(response.body.data.doorTypes.length).toBeGreaterThan(0);
    });

    /* Kâr marjı ağdan geçmemeli; arayüzün göstermemesine bırakılamaz. */
    it('kâr marjını TAŞIMAZ', async () => {
      const response = await request(app.getHttpServer()).get('/api/pricebook');

      expect(response.body.data.margin).toBeUndefined();
    });
  });

  describe('PUT /api/pricebook', () => {
    it('auth olmadan 401 verir', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/pricebook')
        .send({ data: {} });

      expect(response.status).toBe(401);
    });

    it('yeni sürüm yazar ve aktif kitabı değiştirir', async () => {
      const current = await request(app.getHttpServer()).get('/api/pricebook');
      const next = { ...current.body.data, margin: { multiplier: 1.4 } };

      const saved = await request(app.getHttpServer())
        .put('/api/pricebook')
        .set('Authorization', `Bearer ${token}`)
        .send({ data: next });

      expect(saved.status).toBe(200);
      expect(saved.body.version).toBe(1);
    });
  });

  describe('POST /api/quotes', () => {
    it('auth istemez ve 201 ile kod döner', async () => {
      const response = await createQuote();

      expect(response.status).toBe(201);
      expect(response.body.code).toMatch(/^UM-\d{4}-[A-Z0-9]{6}$/);
      expect(response.body.price.total).toBeGreaterThan(0);
    });

    it('geçersiz telefon 400 verir', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/quotes')
        .send({
          productType: 'gardirop',
          config: await config(),
          contact: { name: 'Deniz', phone: '123' },
        });

      expect(response.status).toBe(400);
    });

    it('bilinmeyen ürün tipi 400 verir', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/quotes')
        .send({ productType: 'mutfak', config: await config(), contact: CONTACT });

      expect(response.status).toBe(400);
    });

    /* `forbidNonWhitelisted` gövdeye sıkıştırılan fiyatı reddediyor. */
    it('gövdeye fiyat eklenirse 400 verir', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/quotes')
        .send({
          productType: 'gardirop',
          config: await config(),
          contact: CONTACT,
          price: { total: 1 },
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/quotes/:code', () => {
    it('auth istemez — teklifi veren oturum açmıyor', async () => {
      const created = await createQuote();

      const response = await request(app.getHttpServer()).get(
        `/api/quotes/${created.body.code}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.contact.name).toBe(CONTACT.name);
    });

    it('bilinmeyen kod 404 verir', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/quotes/UM-2608-ZZZZZZ',
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({ statusCode: 404, path: expect.any(String) }),
      );
    });
  });

  describe('GET /api/quotes', () => {
    it('auth olmadan 401 verir', async () => {
      const response = await request(app.getHttpServer()).get('/api/quotes');

      expect(response.status).toBe(401);
    });

    it('auth ile listeler', async () => {
      await createQuote();

      const response = await request(app.getHttpServer())
        .get('/api/quotes')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.items[0].contactPhone).toBe(CONTACT.phone);
    });
  });

  describe('DELETE /api/quotes/:code', () => {
    it('auth olmadan 401 verir', async () => {
      const created = await createQuote();

      const response = await request(app.getHttpServer()).delete(
        `/api/quotes/${created.body.code}`,
      );

      expect(response.status).toBe(401);
    });

    it('auth ile siler ve 204 verir', async () => {
      const created = await createQuote();

      const response = await request(app.getHttpServer())
        .delete(`/api/quotes/${created.body.code}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });
  });
});
