import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

/*
 * Mirrors models/category.model.js exactly, including `createdAt` as an
 * ordinary field with a default rather than a mongoose `timestamps` option.
 * Switching to `timestamps` would add `updatedAt` to every response and change
 * the wire contract for no reason.
 */
@Schema({ collection: 'categories' })
export class Category {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
