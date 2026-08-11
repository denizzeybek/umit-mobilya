import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

import { Category } from '../../category/schemas/category.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
export class ProductModuleRef {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ type: Number, default: 1 })
  quantity!: number;
}

export const ProductModuleRefSchema =
  SchemaFactory.createForClass(ProductModuleRef);

@Schema({ collection: 'products' })
export class Product {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Number, required: true })
  price!: number;

  @Prop({ type: String, default: 'TRY' })
  currency!: string;

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

  @Prop({ type: Number, default: 1 })
  quantity!: number;

  /**
   * A product is both a standalone item and a possible module of another one.
   * Stored as `{ productId, quantity }`; the read path flattens it into a very
   * different shape — see ProductService.toReadModel.
   */
  @Prop({ type: [ProductModuleRefSchema], default: [] })
  modules!: ProductModuleRef[];

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
