import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';

import { ObjectStorageService } from './object-storage.service';

/** Bir yıl. Anahtar rastgele son ek taşıyor, içerik hiç değişmiyor. */
const CACHE_SECONDS = 31_536_000;

/**
 * Yerel diske yazılmış görselleri servis eder — R2'nin public kova adresinin
 * geliştirmedeki karşılığı.
 *
 * PUBLIC, çünkü R2 kovası da public: ürün fotoğrafı ve kaplama deseni zaten
 * herkese açık, önlerine oturum koymak iki modun davranışını ayrıştırırdı.
 *
 * Swagger'dan ÇIKARILDI (`ApiExcludeController`): bu uç üretilmiş istemciye
 * girmemeli. İstemci bu adresleri hiç kurmuyor — sunucudan `textureUrl` /
 * `imageUrl` olarak hazır alıyor, tıpkı R2 modunda olduğu gibi.
 */
@ApiExcludeController()
@Controller('api/storage')
export class StorageController {
  constructor(private readonly storage: ObjectStorageService) {}

  @Get(':key')
  async read(
    @Param('key') key: string,
    @Res() response: Response,
  ): Promise<void> {
    const found = await this.storage.readLocal(key);

    /*
     * Güvensiz anahtar, olmayan anahtar ve R2 modu AYNI cevabı alıyor.
     * Ayırmak, dosya sisteminde neyin var olduğunu dışarıya söylemek olurdu —
     * ve anahtar denetimi zaten depoya gömülü (`local-disk.storage.ts`).
     */
    if (!found) throw new NotFoundException('Nesne bulunamadı');

    response
      .type(found.contentType)
      .setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}, immutable`)
      .send(found.body);
  }
}
