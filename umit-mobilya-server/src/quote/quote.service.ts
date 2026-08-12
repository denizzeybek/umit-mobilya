import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { PriceBookService } from '../configurator/pricebook.service';
import { PricingService } from '../configurator/pricing.service';

import { generateQuoteCode } from './quote-code';
import { Quote } from './schemas/quote.schema';

import type { IBaseConfig } from '../configurator/generated/pricing/config';
import type { CreateQuoteDto } from './dto/create-quote.dto';
import type { QuoteListDto, QuoteResponseDto } from './dto/quote-response.dto';

/**
 * Teklif talepleri.
 *
 * İki şey burada bilinçli:
 *
 * 1. **Tutar sunucuda hesaplanır.** İstek yalnızca `productType`, `config` ve
 *    `contact` taşır; gövdedeki bir `price` alanı yok sayılır. Aksi halde
 *    admin panelindeki her rakam istemcinin iddiası olurdu.
 *
 * 2. **Fiyat dondurulur.** Parça listesi ve döküm kayda gömülür. Admin bir m²
 *    fiyatını değiştirdiğinde geçmiş tekliflerin tutarı geriye dönük
 *    değişmez — bu, planın en kolay atlanacak ve en pahalıya patlayacak
 *    maddesiydi.
 */
const CONFIG_SCHEMA_VERSION = 1;

@Injectable()
export class QuoteService {
  constructor(
    @InjectModel(Quote.name) private readonly model: Model<Quote>,
    private readonly pricing: PricingService,
    private readonly priceBook: PriceBookService,
  ) {}

  async create(dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    const book = await this.priceBook.active();
    const config = dto.config as unknown as IBaseConfig;

    const computed = this.pricing.quote(dto.productType, config, book);

    const created = await this.model.create({
      code: generateQuoteCode(new Date()),
      productType: dto.productType,
      configSchemaVersion: CONFIG_SCHEMA_VERSION,
      config: dto.config,
      parts: computed.parts as unknown as Record<string, unknown>[],
      price: computed.price as unknown as Record<string, unknown>,
      priceBookVersion: book.version,
      contact: dto.contact,
      createdAt: new Date(),
    });

    return this.toReadModel(created.toObject());
  }

  async byCode(code: string): Promise<QuoteResponseDto> {
    const found = await this.model.findOne({ code }).lean().exec();
    if (!found) throw new NotFoundException('Teklif bulunamadı');

    return this.toReadModel(found);
  }

  async list(limit: number, skip: number): Promise<QuoteListDto> {
    const [rows, total] = await Promise.all([
      this.model.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.model.countDocuments({}),
    ]);

    return {
      items: rows.map((row) => ({
        code: row.code,
        productType: row.productType,
        total: Number((row.price as { total?: number }).total ?? 0),
        contactName: row.contact.name,
        contactPhone: row.contact.phone,
        createdAt: row.createdAt,
      })),
      total,
    };
  }

  async remove(code: string): Promise<void> {
    const removed = await this.model.findOneAndDelete({ code }).lean().exec();
    if (!removed) throw new NotFoundException('Teklif bulunamadı');
  }

  private toReadModel(row: Quote): QuoteResponseDto {
    return {
      code: row.code,
      productType: row.productType,
      configSchemaVersion: row.configSchemaVersion,
      config: row.config,
      price: row.price as unknown as QuoteResponseDto['price'],
      priceBookVersion: row.priceBookVersion,
      contact: row.contact,
      createdAt: row.createdAt,
    };
  }
}
