import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { connect, Model } from 'mongoose';

import { ObjectStorageService } from '../storage/object-storage.service';

import { DEFAULT_PRICE_BOOK } from './generated/pricing/defaults';
import { PriceBookService } from './pricebook.service';
import { PriceBook, PriceBookSchema } from './schemas/pricebook.schema';

import type { IPriceBook } from './generated/pricing/priceBook';
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

  /*
   * R2 asla gerçek değil (Rule 09). Kova çağrısı kaydediliyor ki "hangi
   * anahtarla yüklendi" iddia edilebilsin.
   */
  const storage = {
    buildKey: jest.fn((name: string) => `${name}-key`),
    uploadTexture: jest.fn(async () => undefined),
    publicUrl: jest.fn((key: string | null | undefined) =>
      key ? `https://img.test/${key}` : null,
    ),
  };

  const withTexture = (book: IPriceBook): IPriceBook => ({
    ...book,
    finishes: book.finishes.map((finish, index) =>
      index === 0 ? { ...finish, textureName: 'ceviz-damar-key' } : finish,
    ),
  });

  beforeEach(async () => {
    model = connection.model(PriceBook.name, PriceBookSchema);
    await model.deleteMany({});
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PriceBookService,
        { provide: getModelToken(PriceBook.name), useValue: model },
        { provide: ObjectStorageService, useValue: storage },
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

  /*
   * Doku görseli için kural ürün görselleriyle aynı (Rule 10): kitapta
   * ANAHTAR durur, URL okuma anında kurulur.
   */
  it('public görünüm doku anahtarını URL e çevirir', async () => {
    await service.publish(withTexture(DEFAULT_PRICE_BOOK));

    const publicView = await service.activePublic();

    expect(publicView.finishes[0]?.textureName).toBe('ceviz-damar-key');
    expect(publicView.finishes[0]?.textureUrl).toBe(
      'https://img.test/ceviz-damar-key',
    );
  });

  it('dokusu olmayan kaplamanın URL i null olur', async () => {
    await service.publish(DEFAULT_PRICE_BOOK);

    const publicView = await service.activePublic();

    expect(publicView.finishes[1]?.textureUrl).toBeNull();
  });

  /*
   * Admin paneli okuduğu kitabı geri yayınlıyor. URL sökülmezse ilk
   * kaydetmede kalıcı hâle gelir ve "DB'de URL tutulmaz" kuralı sessizce
   * delinir — public alan adı değiştiği gün bütün dokular kırılırdı.
   */
  it('yayınlanan kitaba URL yazılmaz, yalnızca anahtar', async () => {
    const book = withTexture(DEFAULT_PRICE_BOOK);
    book.finishes[0] = {
      ...book.finishes[0]!,
      textureUrl: 'https://img.test/ceviz-damar-key',
    };

    await service.publish(book);

    const stored = await model.findOne({ active: true }).lean().exec();
    const finishes = (stored?.data as unknown as IPriceBook).finishes;

    expect(finishes[0]?.textureName).toBe('ceviz-damar-key');
    expect(finishes[0]).not.toHaveProperty('textureUrl');
  });

  /*
   * Anahtar VE URL birlikte dönüyor: admin yüklediği deseni yayınlamadan
   * önce görebilmeli, yoksa "yükledim ama göremiyorum" durumu kalıyor.
   */
  it('doku yükler, anahtarı ve önizleme URL ini döner', async () => {
    const file = {
      buffer: Buffer.from('doku'),
      originalname: 'ceviz damar.jpg',
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    const saved = await service.saveTexture(file);

    expect(saved).toEqual({
      textureName: 'ceviz damar.jpg-key',
      textureUrl: 'https://img.test/ceviz damar.jpg-key',
    });
    expect(storage.uploadTexture).toHaveBeenCalledWith(
      file.buffer,
      saved.textureName,
      'image/jpeg',
    );
  });
});
