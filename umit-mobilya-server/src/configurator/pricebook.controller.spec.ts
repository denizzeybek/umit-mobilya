import { BadRequestException } from '@nestjs/common';

import { PriceBookController } from './pricebook.controller';

import type { PriceBookService } from './pricebook.service';

/**
 * Kontrolör ince: işi servise veriyor. Burada çivilenen tek şey HTTP
 * sınırındaki karar — dosyasız gelen bir yükleme isteğinin ne olacağı.
 *
 * `@UseInterceptors(FileInterceptor)` dosya gelmediğinde hata vermiyor,
 * `file`ı `undefined` bırakıyor. Kontrol edilmezse `file.buffer` okunurken
 * 500 patlıyor — yani "dosya seçmeyi unuttum" bir sunucu hatasına dönüşüyor.
 */
describe('PriceBookController', () => {
  const service = {
    saveTexture: jest.fn(),
  } as unknown as PriceBookService;

  const controller = new PriceBookController(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('yüklenen dosyayı servise verir ve sonucunu döner', async () => {
    const file = {
      buffer: Buffer.from('doku'),
      originalname: 'ceviz.jpg',
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    const saved = {
      textureName: 'ceviz-key',
      textureUrl: 'https://img.test/ceviz-key',
    };
    jest.mocked(service.saveTexture).mockResolvedValue(saved);

    await expect(controller.uploadTexture(file)).resolves.toEqual(saved);
    expect(service.saveTexture).toHaveBeenCalledWith(file);
  });

  it('dosyasız istek 400 verir, 500 değil', async () => {
    await expect(controller.uploadTexture(undefined)).rejects.toThrow(
      BadRequestException,
    );
    expect(service.saveTexture).not.toHaveBeenCalled();
  });
});
