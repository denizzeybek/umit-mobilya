import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import type { HydratedDocument } from 'mongoose';

export type QuoteDocument = HydratedDocument<Quote>;

@Schema({ _id: false })
export class QuoteContact {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true })
  phone!: string;

  @Prop({ type: String })
  email?: string;

  @Prop({ type: String })
  note?: string;
}

export const QuoteContactSchema = SchemaFactory.createForClass(QuoteContact);

/**
 * Bir teklif talebi.
 *
 * **Durum alanı YOK.** Teklif herkese açık bir ekranda yaratılıyor; oturum
 * açmış bir kullanıcı yok, dolayısıyla "gönderildi / onaylandı" diyecek de
 * kimse yok. Teklif yaratılır ve indirilir.
 *
 * **Fiyat DONDURULUR.** `parts` ve `price` birlikte saklanıyor: yalnızca
 * toplamı saklamak, aylar sonra "bu rakam nereden çıktı" sorusunu cevapsız
 * bırakırdı. `priceBookVersion` hangi fiyatlarla verildiğini geri izletiyor.
 */
@Schema({ collection: 'quotes' })
export class Quote {
  /**
   * Müşteriye verilen referans. Sıralı DEĞİL: `GET /api/quotes/:code` public
   * ve kod tahmin edilebilseydi herkes herkesin teklifini iletişim bilgisiyle
   * birlikte okuyabilirdi — sıralı bir kod burada yetkilendirmenin kendisi
   * olurdu ve o rolü taşıyamaz.
   */
  @Prop({ type: String, required: true, unique: true, index: true })
  code!: string;

  @Prop({ type: String, required: true })
  productType!: string;

  /** Faz 1'in config şeması sürümü; eski teklifler okunabilir kalsın diye. */
  @Prop({ type: Number, required: true })
  configSchemaVersion!: number;

  @Prop({ type: Object, required: true })
  config!: Record<string, unknown>;

  /** Donmuş parça listesi — tutarın nereden çıktığının kanıtı. */
  @Prop({ type: [Object], default: [] })
  parts!: Record<string, unknown>[];

  /** Donmuş döküm ve toplam. */
  @Prop({ type: Object, required: true })
  price!: Record<string, unknown>;

  @Prop({ type: Number, required: true })
  priceBookVersion!: number;

  @Prop({ type: QuoteContactSchema, required: true })
  contact!: QuoteContact;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
