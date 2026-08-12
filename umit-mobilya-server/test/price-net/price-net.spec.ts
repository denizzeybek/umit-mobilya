import request from 'supertest';

import { DEFAULT_PRICE_BOOK } from '../../src/configurator/generated/pricing/defaults';
import { createTestApp } from '../create-test-app';
import {
  clearCollections,
  connectTestMongo,
  disconnectTestMongo,
} from '../mongo-memory';

import { priceCases } from './cases';
import { goldenFor } from './golden';
import { normalizeQuote } from './normalize';

import type { QuoteResponseDto } from '../../src/quote/dto/quote-response.dto';
import type { INestApplication } from '@nestjs/common';

/**
 * Fiyat ağı — kanonik tasarımların tutarı dondurulmuş hâliyle.
 *
 * `pricing-sync.spec.ts` motorun istemci ve sunucu kopyalarının BAYT BAYT aynı
 * olduğunu kanıtlıyor. Ama iki kopyanın aynı olması sonucun DOĞRU olduğunu
 * kanıtlamıyor: bir katsayı yanlışsa iki taraf da aynı yanlış sayıyı üretir ve
 * senkron testi yeşil kalır.
 *
 * Bu ağın cevapladığı soru o: bu tasarımın tutarı bugün de dün verdiği sayı mı?
 *
 * Tutar GERÇEK uçtan geçirilerek üretiliyor (`POST /api/quotes`), servis elle
 * çağrılarak değil — golden'ın kanıtladığı şey uç + ValidationPipe + motor
 * zincirinin tamamı.
 *
 * Kural: .claude/rules/13-price-net.md
 */
describe('fiyat ağı — dondurulmuş tutarlar', () => {
  let app: INestApplication;

  const CONTACT = { name: 'Fiyat Ağı', phone: '0500 000 00 00' };

  beforeAll(async () => {
    await connectTestMongo();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestMongo();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  /*
   * Kitap kaydı YOK: `PriceBookService.active()` kayıt bulamazsa tohum kitabı
   * döner ve sürüm 0 olur. Golden'lar bilerek o taban üstünde duruyor — bir
   * senaryonun yayınladığı kitap goldenları oynatamasın diye.
   */
  for (const scenario of priceCases(DEFAULT_PRICE_BOOK)) {
    it(`${scenario.id}: ${scenario.title}`, async () => {
      const response = await request(app.getHttpServer())
        .post('/api/quotes')
        .send({
          productType: scenario.productType,
          config: scenario.config,
          contact: CONTACT,
        });

      expect(response.status).toBe(201);

      const normalized = normalizeQuote(response.body as QuoteResponseDto);
      const golden = await goldenFor(scenario.id, normalized);

      expect(normalized).toEqual(golden);
    });
  }
});
