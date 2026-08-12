import { ApiProperty } from '@nestjs/swagger';

import { CategoryResponseDto } from '../../category/dto/category-response.dto';

/**
 * Portfolyo kaydı, okuma şekliyle.
 *
 * `price`, `currency`, `quantity` ve `modules[]` KALDIRILDI: modül sistemi
 * konfigüratörün düzgün yaptığı işin ilkel bir versiyonuydu, sabit fiyat da
 * ısmarlama üretimde yanlış. Portfolyo artık fiyat göstermiyor.
 */
export class ProductResponseDto {
  _id!: string;

  name!: string;

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

  /**
   * Konfigüratör başlangıç noktası: `{ productType, config }`. Arayüz bunu
   * URL'e kodlayıp "benzerini kendi ölçünle kur" bağlantısını kuruyor;
   * portfolyoyu vitrin olmaktan çıkarıp huniye çeviriyor.
   */
  @ApiProperty({ type: Object, required: false })
  configuratorPreset?: Record<string, unknown>;
}

/**
 * Yazma uçlarının döndürdüğü şey: saklanan belge, okuma şekli değil.
 * Burada `imageUrl` yok — ihtiyaç varsa okuma ucundan tekrar çekilir.
 */
export class ProductDocumentDto {
  _id!: string;

  name!: string;

  imageName?: string;

  imageNameList!: string[];

  sizes?: string;

  description?: string;

  /** Category id. Not populated on the write path. */
  category?: string;

  createdAt!: string;
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
