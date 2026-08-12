import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ObjectStorageService } from '../storage/object-storage.service';

import { DEFAULT_PRICE_BOOK } from './generated/pricing/defaults';
import { PriceBook } from './schemas/pricebook.schema';

import type { IFinish, IPriceBook } from './generated/pricing/priceBook';

/**
 * Fiyat kitabının okunması ve yayınlanması.
 *
 * Hiçbir kayıt güncellenmiyor: `publish` her çağrıda YENİ bir sürüm yazıp
 * `active` bayrağını taşıyor. Teklifler sürüm numarasını sakladığı için
 * "bu tutar hangi fiyatlarla çıktı" sorusu her zaman cevaplanabiliyor.
 *
 * Kayıt yokken tohum kitap dönüyor: admin veri girene kadar site çalışmalı,
 * ve API düştüğünde konfigüratör açılmaya devam etmeli.
 */
export type TPublicPriceBook = Omit<IPriceBook, 'margin'>;

export interface ITextureUpload {
  /** Kitaba yazılacak olan — R2 nesne anahtarı. */
  textureName: string;
  /** Yalnızca önizleme için; kitaba YAZILMAZ. */
  textureUrl: string | null;
}

@Injectable()
export class PriceBookService {
  constructor(
    @InjectModel(PriceBook.name)
    private readonly model: Model<PriceBook>,
    private readonly storage: ObjectStorageService,
  ) {}

  /**
   * Desen görselini kovaya koyar. Kitaba yazılacak olan ANAHTAR; URL yanında
   * dönüyor ama yalnızca adminin yüklediğini hemen görebilmesi için — kayda
   * anahtar giriyor (Rule 10).
   */
  async saveTexture(file: Express.Multer.File): Promise<ITextureUpload> {
    const textureName = this.storage.buildKey(file.originalname);
    await this.storage.uploadTexture(file.buffer, textureName, file.mimetype);

    return { textureName, textureUrl: this.storage.publicUrl(textureName) };
  }

  async active(): Promise<IPriceBook> {
    const found = await this.model.findOne({ active: true }).lean().exec();
    if (!found) return DEFAULT_PRICE_BOOK;

    return { ...(found.data as unknown as IPriceBook), version: found.version };
  }

  /**
   * Kâr marjı çıkarılmış, doku URL'leri eklenmiş hâli — konfigüratörün
   * gördüğü kitap budur.
   */
  async activePublic(): Promise<TPublicPriceBook> {
    const { margin: _margin, ...rest } = await this.active();

    return {
      ...rest,
      finishes: rest.finishes.map((finish) => ({
        ...finish,
        textureUrl: this.storage.publicUrl(finish.textureName),
      })),
    };
  }

  async byVersion(version: number): Promise<IPriceBook | null> {
    const found = await this.model.findOne({ version }).lean().exec();
    if (!found) return null;

    return { ...(found.data as unknown as IPriceBook), version: found.version };
  }

  async versions(): Promise<{ version: number; createdAt: Date }[]> {
    const rows = await this.model
      .find({}, { version: 1, createdAt: 1 })
      .sort({ version: -1 })
      .lean()
      .exec();

    return rows.map((row) => ({ version: row.version, createdAt: row.createdAt }));
  }

  /**
   * Yazmadan önce türetilmiş alanları söker.
   *
   * Admin paneli okuduğu kitabı geri yayınlıyor, yani `activePublic`in eklediği
   * `textureUrl` geri geliyor. Sökülmezse ilk kaydetmede kalıcı olur ve
   * "DB'de URL tutulmaz" kuralı sessizce delinir — public alan adı değiştiği
   * gün bütün dokular kırılır ve sebebi kitabın içinde saklı kalırdı.
   */
  private static stripDerived(book: IPriceBook): IPriceBook {
    return {
      ...book,
      finishes: book.finishes.map((finish) => {
        const { textureUrl: _textureUrl, ...rest } = finish as IFinish;
        return rest;
      }),
    };
  }

  async publish(input: IPriceBook): Promise<IPriceBook> {
    const book = PriceBookService.stripDerived(input);

    const latest = await this.model
      .findOne({}, { version: 1 })
      .sort({ version: -1 })
      .lean()
      .exec();

    const version = (latest?.version ?? 0) + 1;

    await this.model.updateMany({ active: true }, { $set: { active: false } });
    await this.model.create({
      version,
      active: true,
      data: { ...book, version },
      createdAt: new Date(),
    });

    return { ...book, version };
  }
}
