import { ApiProperty } from '@nestjs/swagger';

import { CategoryResponseDto } from '../../category/dto/category-response.dto';

/**
 * A module as the API returns it.
 *
 * Note the shape: the database stores `{ productId, quantity }`, but the read
 * path replaces `productId` with the fields of the product it points at. So
 * `_id` here is the **module product's** id, not an id of the module entry.
 */
export class ProductModuleResponseDto {
  _id!: string;

  name!: string;

  price!: number;

  currency!: string;

  /** Permanent public R2 URL, or null when that product has no image. */
  imageUrl!: string | null;

  /** How many of this module the parent product contains. */
  quantity!: number;

  sizes?: string;

  description?: string;

  category?: CategoryResponseDto;
}

export class ProductResponseDto {
  _id!: string;

  name!: string;

  /** Base price, before modules are added. */
  price!: number;

  currency!: string;

  /** R2 object key of the main image. Never send this back as a URL. */
  imageName?: string;

  /** Permanent public R2 URL composed from `imageName`, or null when unset. */
  imageUrl!: string | null;

  /** R2 object keys of the gallery images. */
  imageNameList!: string[];

  /*
   * The one place an explicit @ApiProperty is warranted. The swagger CLI
   * plugin cannot express "array of nullable string" from the TypeScript type
   * alone — it emits `Record<string, any>`, and the generated client then
   * types every gallery URL as an untyped object. Everything else in this file
   * is inferred; see .claude/rules/06-validation-and-errors.md.
   */
  @ApiProperty({
    type: 'array',
    items: { type: 'string', nullable: true },
    description: 'Public URLs matching `imageNameList`, position for position.',
  })
  imageUrlList!: (string | null)[];

  sizes?: string;

  description?: string;

  category?: CategoryResponseDto;

  quantity!: number;

  modules!: ProductModuleResponseDto[];

  /** `price` plus, for every module, its price times its quantity. */
  totalPrice!: number;
}

/**
 * What the write endpoints return: the stored document, not the read shape.
 * There is no `totalPrice`, no `imageUrl` and no flattened `modules` here —
 * refetch through a read endpoint if you need those.
 */
export class ProductDocumentDto {
  _id!: string;

  name!: string;

  price!: number;

  currency!: string;

  imageName?: string;

  imageNameList!: string[];

  sizes?: string;

  description?: string;

  /** Category id. Not populated on the write path. */
  category?: string;

  quantity!: number;

  modules!: StoredModuleDto[];

  createdAt!: string;
}

export class StoredModuleDto {
  /** Id of the product used as a module. */
  productId!: string;

  quantity!: number;
}

export class ProductEnvelopeDto {
  message!: string;

  product!: ProductDocumentDto;
}

export class ImageListResponseDto {
  message!: string;

  /** The product's full gallery key list after the upload, not just the new keys. */
  imageNameList!: string[];
}
