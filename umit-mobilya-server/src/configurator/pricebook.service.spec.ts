import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { connect, Model } from 'mongoose';

import { DEFAULT_PRICE_BOOK } from './generated/pricing/defaults';
import { PriceBookService } from './pricebook.service';
import { PriceBook, PriceBookSchema } from './schemas/pricebook.schema';

import type { Connection } from 'mongoose';

/**
 * Fiyat kitabı SÜRÜMLENİR ve kayıtlar değiştirilmez. Bu, teklif fiyatının
 * dondurulmasının ön koşulu: admin bir m² fiyatını değiştirdiğinde geçmiş
 * tekliflerin tutarı geriye dönük değişmemeli.
 */
describe('PriceBookService', () => {
  let connection: Connection;
  let model: Model<PriceBook>;
  let service: PriceBookService;

  beforeAll(async () => {
    const mongo = await connect(process.env.MONGO_URI as string);
    connection = mongo.connection;
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    model = connection.model(PriceBook.name, PriceBookSchema);
    await model.deleteMany({});

    const moduleRef = await Test.createTestingModule({
      providers: [
        PriceBookService,
        { provide: getModelToken(PriceBook.name), useValue: model },
      ],
    }).compile();

    service = moduleRef.get(PriceBookService);
  });

  it('kayıt yokken tohum kitabı döner', async () => {
    const book = await service.active();

    expect(book.version).toBe(DEFAULT_PRICE_BOOK.version);
    expect(book.materials.length).toBe(DEFAULT_PRICE_BOOK.materials.length);
  });

  it('ilk kayıt 1. sürüm olur ve aktifleşir', async () => {
    const saved = await service.publish(DEFAULT_PRICE_BOOK);

    expect(saved.version).toBe(1);
    expect((await service.active()).version).toBe(1);
  });

  it('her yayın sürümü artırır', async () => {
    await service.publish(DEFAULT_PRICE_BOOK);
    const second = await service.publish(DEFAULT_PRICE_BOOK);

    expect(second.version).toBe(2);
  });

  /* Dondurmanın kalbi: eski sürüm olduğu yerde kalmalı. */
  it('eski sürüm değişmez ve okunabilir kalır', async () => {
    await service.publish({ ...DEFAULT_PRICE_BOOK, margin: { multiplier: 1.1 } });
    await service.publish({ ...DEFAULT_PRICE_BOOK, margin: { multiplier: 9.9 } });

    const first = await service.byVersion(1);

    expect(first?.margin.multiplier).toBe(1.1);
  });

  it('yalnızca tek kayıt aktif kalır', async () => {
    await service.publish(DEFAULT_PRICE_BOOK);
    await service.publish(DEFAULT_PRICE_BOOK);

    expect(await model.countDocuments({ active: true })).toBe(1);
  });

  it('sürüm listesi yeniden eskiye sıralanır', async () => {
    await service.publish(DEFAULT_PRICE_BOOK);
    await service.publish(DEFAULT_PRICE_BOOK);

    const versions = await service.versions();

    expect(versions.map((item) => item.version)).toEqual([2, 1]);
  });

  /*
   * Kâr marjı müşteriye gösterilmez. Public cevabın onu taşımaması, sadece
   * arayüzün göstermemesine bırakılamaz — gövde ağdan geçiyor.
   */
  it('public görünüm kâr marjını taşımaz', async () => {
    await service.publish(DEFAULT_PRICE_BOOK);

    const publicView = await service.activePublic();

    expect(publicView).not.toHaveProperty('margin');
    expect(publicView.materials.length).toBeGreaterThan(0);
  });
});
