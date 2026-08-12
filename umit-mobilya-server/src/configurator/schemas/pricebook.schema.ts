import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import type { HydratedDocument } from 'mongoose';

export type PriceBookDocument = HydratedDocument<PriceBook>;

/**
 * Fiyat kitabının sürümlenmiş kaydı.
 *
 * **Kayıtlar değiştirilmez.** `PUT` yeni bir sürüm yazar ve `active`'i taşır;
 * eskisi olduğu yerde kalır. Bu, teklif fiyatının dondurulmasının ön koşulu:
 * admin bir m² fiyatını değiştirdiğinde geçmiş tekliflerin tutarı geriye
 * dönük değişmemeli, ve hangi rakamlarla verildiği geri izlenebilmeli.
 *
 * Rule 10'un "denormalize etme" ilkesiyle çelişmiyor: buradaki kopya bilinçli
 * ve TARİHSEL, senkron tutulacak bir şey yok.
 */
@Schema({ collection: 'pricebooks' })
export class PriceBook {
  /** Artan sürüm numarası; teklif kaydı bunu referans alır. */
  @Prop({ type: Number, required: true, unique: true })
  version!: number;

  /** Konfigüratörün okuduğu sürüm. Tek kayıtta true olur. */
  @Prop({ type: Boolean, default: false, index: true })
  active!: boolean;

  /**
   * `IPriceBook` gövdesi. Şema serbest çünkü katalog admin'in elinde ve
   * yeni bir malzeme alanı eklemek migration gerektirmemeli; doğrulama
   * `UpdatePriceBookDto` içinde, isteğin sınırında yapılıyor.
   */
  @Prop({ type: Object, required: true })
  data!: Record<string, unknown>;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const PriceBookSchema = SchemaFactory.createForClass(PriceBook);
