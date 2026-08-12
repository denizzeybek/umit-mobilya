import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

import { Category } from '../../category/schemas/category.schema';

export type ProductDocument = HydratedDocument<Product>;

/**
 * Portfolyo kaydı: yapılan işin fotoğrafı, açıklaması, kategorisi.
 *
 * `price`, `currency`, `quantity` ve `modules[]` KALDIRILDI. Modül sistemi
 * ("bu ürün şu parçalardan oluşur, toplamı şu eder") konfigüratörün düzgün
 * yaptığı işin ilkel bir versiyonuydu; ikisini birden tutmak "bir mobilya
 * neyden oluşur" sorusuna iki ayrı cevap demekti ve hangisinin doğru olduğu
 * zamanla belirsizleşirdi.
 *
 * Sabit fiyat da ısmarlama üretimde yanlış: fiyat ölçüden çıkıyor, katalogdan
 * değil. Portfolyo artık fiyat göstermiyor, her şey teklife gidiyor.
 */
@Schema({ collection: 'products' })
export class Product {
  @Prop({ type: String, required: true })
  name!: string;

  /** R2 object key of the main image. Never a URL — see ObjectStorageService. */
  @Prop({ type: String })
  imageName?: string;

  /** R2 object keys of the gallery images. */
  @Prop({ type: [String], default: [] })
  imageNameList!: string[];

  @Prop({ type: String })
  sizes?: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: Category.name })
  category?: Types.ObjectId;

  /**
   * Portfolyodan konfigüratöre köprü: "bu mutfağı beğendin mi? benzerini
   * kendi ölçünle kur". Portfolyoyu vitrin olmaktan çıkarıp huniye çeviriyor —
   * fotoğraf ilgi çekiyor, tek tık konfigüratöre, oradan teklife.
   *
   * `{ productType, config }` şeklinde; arayüz bunu URL'e kodlayıp
   * konfigüratöre gönderiyor, ek bir mekanizma gerekmiyor.
   */
  @Prop({ type: Object })
  configuratorPreset?: Record<string, unknown>;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
