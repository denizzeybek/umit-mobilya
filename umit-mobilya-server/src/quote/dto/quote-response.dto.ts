import { ApiProperty } from '@nestjs/swagger';

export class QuotePriceLineDto {
  /** Dökümde görünen kalem adı. */
  readonly label!: string;

  /** Kalem tutarı, TRY. */
  readonly amount!: number;
}

export class QuotePriceDto {
  /**
   * Müşteriye gösterilen kalemler. Gizli maliyetler (arkalık, kâr marjı)
   * burada YOKTUR ama toplama dahildir — bu yüzden satırların toplamı
   * `total` ile tutmaz.
   */
  @ApiProperty({ type: [QuotePriceLineDto] })
  readonly lines!: QuotePriceLineDto[];

  /** KDV öncesi tutar, marj dahil. */
  readonly netTotal!: number;

  /** Hesaplanan KDV. */
  readonly vat!: number;

  /** Ödenecek tutar. */
  readonly total!: number;
}

export class QuoteContactResponseDto {
  readonly name!: string;
  readonly phone!: string;
  readonly email?: string;
  readonly note?: string;
}

export class QuoteResponseDto {
  /** Müşteriye verilen referans, örn. `UM-2608-K7M4XQ`. */
  readonly code!: string;

  readonly productType!: string;

  /** Tasarımın şema sürümü. */
  readonly configSchemaVersion!: number;

  /** Konfigüratörün ürettiği tasarım, olduğu gibi. */
  @ApiProperty({ type: Object })
  readonly config!: Record<string, unknown>;

  /** Teklif verildiği andaki fiyat — sonradan DEĞİŞMEZ. */
  readonly price!: QuotePriceDto;

  /** Hangi fiyat kitabı sürümüyle hesaplandığı. */
  readonly priceBookVersion!: number;

  readonly contact!: QuoteContactResponseDto;

  readonly createdAt!: Date;
}

export class QuoteListItemDto {
  readonly code!: string;
  readonly productType!: string;
  readonly total!: number;
  readonly contactName!: string;
  readonly contactPhone!: string;
  readonly createdAt!: Date;
}

export class QuoteListDto {
  @ApiProperty({ type: [QuoteListItemDto] })
  readonly items!: QuoteListItemDto[];

  /** Toplam kayıt sayısı — sayfalama için. */
  readonly total!: number;
}
