import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdatePriceBookDto {
  /**
   * Fiyat kitabının tamamı. Her `PUT` yeni bir sürüm yazar; var olan kayıt
   * güncellenmez, çünkü geçmiş tekliflerin hangi rakamlarla verildiği geri
   * izlenebilir kalmalı.
   *
   * Gövde serbest şema: katalog admin'in elinde ve yeni bir malzeme alanı
   * eklemek migration gerektirmemeli.
   */
  @IsObject()
  @ApiProperty({ type: Object })
  readonly data!: Record<string, unknown>;
}

export class PriceBookVersionDto {
  /** Artan sürüm numarası. */
  readonly version!: number;

  readonly createdAt!: Date;
}

export class PriceBookResponseDto {
  /** Aktif sürüm numarası. Tohum kitap için 0. */
  readonly version!: number;

  /**
   * Kitabın gövdesi. Public cevapta kâr marjı BULUNMAZ — arayüzün
   * göstermemesine bırakılamaz, gövde ağdan geçiyor.
   */
  @ApiProperty({ type: Object })
  readonly data!: Record<string, unknown>;
}

/**
 * Yalnızca Swagger'ın multipart gövdesini tarif etmesi için. Alan adı
 * `image` — ürün yüklemeleriyle aynı, ki istemci tarafında iki ayrı isim
 * hatırlanmasın.
 */
export class TextureUploadBodyDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  readonly image!: unknown;
}

export class TextureUploadResponseDto {
  /** Kitaba yazılacak olan R2 nesne anahtarı. */
  readonly textureName!: string;

  /**
   * Yüklenen desenin public adresi. Yalnızca adminin yüklediğini hemen
   * görebilmesi için; kitaba YAZILMAZ, okuma anında yeniden kurulur.
   */
  @ApiProperty({ type: String, nullable: true })
  readonly textureUrl!: string | null;
}
