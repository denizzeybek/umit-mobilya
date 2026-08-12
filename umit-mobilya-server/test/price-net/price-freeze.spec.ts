import request from 'supertest';

import { DEFAULT_PRICE_BOOK } from '../../src/configurator/generated/pricing/defaults';
import { createTestApp, signTestToken } from '../create-test-app';
import {
  clearCollections,
  connectTestMongo,
  disconnectTestMongo,
} from '../mongo-memory';

import { priceCases } from './cases';

import type { IPriceBook } from '../../src/configurator/generated/pricing/priceBook';
import type { QuoteResponseDto } from '../../src/quote/dto/quote-response.dto';
import type { INestApplication } from '@nestjs/common';

/**
 * Fiyatın DONDURULMASI — golden'ı olamayan, davranışsal iddia.
 *
 * Buradaki soru sabit bir sayı değil, iki koşum arasındaki İLİŞKİ: admin bir
 * m² fiyatını değiştirdiğinde geçmiş tekliflerin tutarı geriye dönük
 * DEĞİŞMEMELİ. Bu, planın en kolay atlanacak ve en pahalıya patlayacak
 * maddesiydi: müşteriye verilmiş bir rakamın kendi kendine oynaması.
 *
 * `total`i tekrar hesaplayan bir kod (kayıttan okumak yerine) bu spec'i
 * kırar — ve başka hiçbir şey kırmaz.
 *
 * Kural: .claude/rules/13-price-net.md §6
 */
describe('fiyat dondurma', () => {
  let app: INestApplication;
  let token: string;

  const CONTACT = { name: 'Fiyat Ağı', phone: '0500 000 00 00' };

  const scenario = () => {
    const found = priceCases(DEFAULT_PRICE_BOOK).find(
      (item) => item.id === 'gardirop-standart',
    );
    if (!found) throw new Error('gardirop-standart case bulunamadı.');

    return found;
  };

  const createQuote = async (): Promise<QuoteResponseDto> => {
    const design = scenario();
    const response = await request(app.getHttpServer())
      .post('/api/quotes')
      .send({
        productType: design.productType,
        config: design.config,
        contact: CONTACT,
      });

    expect(response.status).toBe(201);
    return response.body as QuoteResponseDto;
  };

  /** Her malzemenin m² fiyatı iki katına çıkmış bir kitap yayınlar. */
  const publishDearerBook = async (): Promise<void> => {
    const dearer: IPriceBook = {
      ...DEFAULT_PRICE_BOOK,
      materials: DEFAULT_PRICE_BOOK.materials.map((material) => ({
        ...material,
        pricePerM2: material.pricePerM2 * 2,
      })),
    };

    const response = await request(app.getHttpServer())
      .put('/api/pricebook')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: dearer });

    expect(response.status).toBe(200);
  };

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

  it('yayınlanan yeni fiyat kitabı geçmiş teklifin tutarını DEĞİŞTİRMEZ', async () => {
    const before = await createQuote();

    await publishDearerBook();

    const after = await request(app.getHttpServer()).get(
      `/api/quotes/${before.code}`,
    );

    expect(after.status).toBe(200);
    expect(after.body.price).toEqual(before.price);
    expect(after.body.priceBookVersion).toBe(before.priceBookVersion);
  });

  it('yeni teklif yeni kitapla hesaplanır ve sürümünü taşır', async () => {
    const before = await createQuote();

    await publishDearerBook();

    const after = await createQuote();

    expect(after.price.total).toBeGreaterThan(before.price.total);
    expect(after.priceBookVersion).toBe(before.priceBookVersion + 1);
  });

  /*
   * Tutarın istemciden gelmediğinin ağ üstündeki kanıtı. Servis spec'i bunu
   * göremez: gövdenin reddi ValidationPipe'ın işi ve o yalnızca gerçek istek
   * yolunda çalışıyor.
   */
  it('gövdedeki bir fiyat alanı kabul edilmez', async () => {
    const design = scenario();

    const response = await request(app.getHttpServer())
      .post('/api/quotes')
      .send({
        productType: design.productType,
        config: design.config,
        contact: CONTACT,
        price: { total: 1 },
      });

    expect(response.status).toBe(400);
  });
});
