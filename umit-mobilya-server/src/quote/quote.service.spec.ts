import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { connect, Model } from 'mongoose';

import { PriceBookService } from '../configurator/pricebook.service';
import { PricingService } from '../configurator/pricing.service';
import { DEFAULT_PRICE_BOOK } from '../configurator/generated/pricing/defaults';

import { QuoteService } from './quote.service';
import { Quote, QuoteSchema } from './schemas/quote.schema';

import type { Connection } from 'mongoose';

const CONTACT = { name: 'Deniz Zeybek', phone: '0549 676 21 08' };

describe('QuoteService', () => {
  let connection: Connection;
  let model: Model<Quote>;
  let service: QuoteService;
  let book = DEFAULT_PRICE_BOOK;

  beforeAll(async () => {
    const mongo = await connect(process.env.MONGO_URI as string);
    connection = mongo.connection;
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    book = DEFAULT_PRICE_BOOK;
    model = connection.model(Quote.name, QuoteSchema);
    await model.deleteMany({});

    const moduleRef = await Test.createTestingModule({
      providers: [
        QuoteService,
        PricingService,
        {
          provide: PriceBookService,
          useValue: { active: async () => book },
        },
        { provide: getModelToken(Quote.name), useValue: model },
      ],
    }).compile();

    service = moduleRef.get(QuoteService);
  });

  const defaultConfig = () =>
    new PricingService().defaultConfig('gardirop', DEFAULT_PRICE_BOOK);

  const create = () =>
    service.create({
      productType: 'gardirop',
      config: defaultConfig() as unknown as Record<string, unknown>,
      contact: CONTACT,
    });

  it('teklif yaratır ve kod verir', async () => {
    const quote = await create();

    expect(quote.code).toMatch(/^UM-\d{4}-[A-Z0-9]{6}$/);
    expect(quote.price.total).toBeGreaterThan(0);
  });

  it('parça listesini de dondurur', async () => {
    const quote = await create();
    const stored = await model.findOne({ code: quote.code }).lean().exec();

    expect(stored?.parts.length).toBeGreaterThan(0);
  });

  /*
   * Bu testin koruduğu şey planın "en pahalıya patlayacak" maddesi: admin bir
   * fiyatı değiştirdiğinde geçmiş teklifin tutarı DEĞİŞMEMELİ.
   */
  it('fiyat kitabı değişse de eski teklifin tutarı değişmez', async () => {
    const quote = await create();
    const before = quote.price.total;

    book = {
      ...DEFAULT_PRICE_BOOK,
      materials: DEFAULT_PRICE_BOOK.materials.map((item) => ({
        ...item,
        pricePerM2: item.pricePerM2 * 10,
      })),
    };

    const again = await create();
    const reread = await service.byCode(quote.code);

    expect(again.price.total).toBeGreaterThan(before);
    expect(reread.price.total).toBe(before);
  });

  it('hangi fiyat kitabı sürümüyle hesaplandığını saklar', async () => {
    const quote = await create();

    expect(quote.priceBookVersion).toBe(DEFAULT_PRICE_BOOK.version);
  });

  /* İstemcinin gönderdiği tutar YOK SAYILIR; sunucu kendi hesaplar. */
  it('istekteki fiyat yok sayılır', async () => {
    const quote = await service.create({
      productType: 'gardirop',
      config: {
        ...(defaultConfig() as unknown as Record<string, unknown>),
        price: { total: 1 },
      },
      contact: CONTACT,
    });

    expect(quote.price.total).toBeGreaterThan(1000);
  });

  it('bilinmeyen kod 404 verir', async () => {
    await expect(service.byCode('UM-2608-XXXXXX')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('liste yeniden eskiye sıralanır ve sayfalanır', async () => {
    await create();
    await create();
    await create();

    const page = await service.list(2, 0);

    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(3);
  });

  it('silinen teklif okunamaz', async () => {
    const quote = await create();

    await service.remove(quote.code);

    await expect(service.byCode(quote.code)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
