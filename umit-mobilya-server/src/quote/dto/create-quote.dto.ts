import { Type } from 'class-transformer';
import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class QuoteContactDto {
  /** Teklifi isteyen kişinin adı. */
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  readonly name!: string;

  /**
   * Türkiye telefon numarası. Boşluk, parantez ve tire kabul edilir;
   * tek zorunluluk on rakam içermesi.
   */
  @IsString()
  @Matches(/^(\+90|0)?[\s(-]*5\d{2}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}$/, {
    message: 'Telefon numarası geçerli bir Türkiye cep numarası olmalı',
  })
  readonly phone!: string;

  /** İsteğe bağlı e-posta adresi. */
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  readonly email?: string;

  /** Müşterinin eklemek istediği not. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly note?: string;
}

export class CreateQuoteDto {
  /** Hangi ürün tipi için teklif isteniyor — `gardirop`, `vestiyer`. */
  @IsString()
  @MaxLength(40)
  readonly productType!: string;

  /**
   * Konfigüratörün ürettiği tasarım. Fiyat BURADA KABUL EDİLMEZ: tutar
   * sunucuda yeniden hesaplanır, yoksa admin panelindeki her sayı
   * istemcinin iddiası olurdu.
   */
  @IsObject()
  readonly config!: Record<string, unknown>;

  /** İletişim bilgileri. */
  @ValidateNested()
  @Type(() => QuoteContactDto)
  readonly contact!: QuoteContactDto;
}
