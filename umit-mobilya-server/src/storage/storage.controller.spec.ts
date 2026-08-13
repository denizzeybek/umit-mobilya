import { NotFoundException } from '@nestjs/common';

import { StorageController } from './storage.controller';

import type { ObjectStorageService } from './object-storage.service';
import type { Response } from 'express';

/**
 * Yerel diske yazılan görselleri servis eden okuma ucu.
 *
 * R2 modunda bu uç HİÇBİR ŞEY servis etmiyor: orada okuma kovanın kendi public
 * adresinden geçiyor ve bu route'un canlı görünmesi, iki ayrı okuma yolu
 * varmış izlenimi verirdi.
 */
describe('StorageController', () => {
  const storage = { readLocal: jest.fn() } as unknown as ObjectStorageService;
  const controller = new StorageController(storage);

  const responseDouble = () => {
    const calls: Record<string, unknown> = {};
    const response = {
      type: (value: string) => {
        calls['type'] = value;
        return response;
      },
      setHeader: (name: string, value: string) => {
        calls['header'] = `${name}: ${value}`;
        return response;
      },
      send: (body: Buffer) => {
        calls['body'] = body;
        return response;
      },
    } as unknown as Response;

    return { response, calls };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bulunan nesneyi kendi içerik tipiyle döner', async () => {
    const body = Buffer.from([0xff, 0xd8, 0xff]);
    jest
      .mocked(storage.readLocal)
      .mockResolvedValue({ body, contentType: 'image/jpeg' });

    const { response, calls } = responseDouble();
    await controller.read('ceviz-abc', response);

    expect(calls['type']).toBe('image/jpeg');
    expect(calls['body']).toBe(body);
  });

  /*
   * Anahtar rastgele son ek taşıyor, yani içerik asla değişmiyor. R2'nin
   * public URL'leri de böyle davranıyor; iki modun önbellek davranışı
   * ayrışırsa "bende görünüyor, sende görünmüyor" başlar.
   */
  it('değişmez önbellek başlığı gönderir', async () => {
    jest.mocked(storage.readLocal).mockResolvedValue({
      body: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      contentType: 'image/png',
    });

    const { response, calls } = responseDouble();
    await controller.read('ceviz-abc', response);

    expect(calls['header']).toContain('immutable');
  });

  /* Yol kaçışı ve olmayan anahtar aynı cevabı alıyor: varlık bilgisi sızmıyor. */
  it('bulunamayan anahtar 404 verir', async () => {
    jest.mocked(storage.readLocal).mockResolvedValue(null);

    const { response } = responseDouble();

    await expect(controller.read('yok-boyle', response)).rejects.toThrow(
      NotFoundException,
    );
  });
});
