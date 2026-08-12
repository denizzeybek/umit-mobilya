import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { DEFAULT_PRICE_BOOK } from './generated/pricing/defaults';
import { PriceBook } from './schemas/pricebook.schema';

import type { IPriceBook } from './generated/pricing/priceBook';

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

@Injectable()
export class PriceBookService {
  constructor(
    @InjectModel(PriceBook.name)
    private readonly model: Model<PriceBook>,
  ) {}

  async active(): Promise<IPriceBook> {
    const found = await this.model.findOne({ active: true }).lean().exec();
    if (!found) return DEFAULT_PRICE_BOOK;

    return { ...(found.data as unknown as IPriceBook), version: found.version };
  }

  /** Kâr marjı çıkarılmış hâli — konfigüratörün gördüğü kitap budur. */
  async activePublic(): Promise<TPublicPriceBook> {
    const { margin: _margin, ...rest } = await this.active();
    return rest;
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

  async publish(book: IPriceBook): Promise<IPriceBook> {
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
