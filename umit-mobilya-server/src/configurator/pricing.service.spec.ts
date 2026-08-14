import { BadRequestException } from '@nestjs/common';

import { DEFAULT_PRICE_BOOK } from './generated/pricing/defaults';
import { createDefaultConfig as gardiropDefaultConfig } from './generated/products/gardirop/options';
import { createDefaultConfig as vestiyerDefaultConfig } from './generated/products/vestiyer/options';
import { PricingService } from './pricing.service';

/**
 * Teklif tutarı SUNUCUDA hesaplanır. İstemcinin gönderdiği rakamı saklamak,
 * admin panelindeki her sayıyı "istemcinin iddiası" yapardı — panel o zaman
 * çalışma yüzeyi olmaktan çıkar.
 */
describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
  });

  const gardirop = () => service.defaultConfig('gardirop');

  it('bilinen her ürün tipi için varsayılan config üretir', () => {
    expect(service.productTypes()).toEqual(['gardirop', 'vestiyer']);

    for (const type of service.productTypes()) {
      expect(service.defaultConfig(type)).toBeTruthy();
    }
  });

  /*
   * Varsayılan tasarım ürünün KENDİ fabrikasından gelmeli, burada elle
   * kurulmamalı. Bir zamanlar elle kurulmuş bir taban vardı (`SECTION_SEED`)
   * ve sessizce ayrışmıştı: vestiyerin bölümünü `shelves: [30]` yazıyordu,
   * ürünün gerçeği `[25]`. Spec'ler müşterinin hiç görmediği bir tasarımı
   * test ediyor ama yeşil yanıyordu.
   *
   * Bu iddia bugün önemsiz görünüyor (aynı fonksiyon) — işi, o kopyanın
   * yeniden yazılmasını kırmızıya çevirmek.
   */
  it('varsayılan tasarım ürünün kendi fabrikasından gelir', () => {
    expect(service.defaultConfig('gardirop')).toEqual(gardiropDefaultConfig());
    expect(service.defaultConfig('vestiyer')).toEqual(vestiyerDefaultConfig());
  });

  it('bilinmeyen ürün tipi 400 verir', () => {
    expect(() => service.defaultConfig('mutfak')).toThrow(
      BadRequestException,
    );
  });

  it('varsayılan gardırop için pozitif tutar ve döküm üretir', () => {
    const result = service.quote('gardirop', gardirop(), DEFAULT_PRICE_BOOK);

    expect(result.price.total).toBeGreaterThan(0);
    expect(result.price.lines.length).toBeGreaterThan(0);
    expect(result.parts.length).toBeGreaterThan(0);
  });

  /*
   * İstemcideki motorun aynısı: 60 x 180 x 60 tek modül, MDF 2000 ₺/m² ->
   * 5 760 ₺. Bu sayı iki tarafta da tutmuyorsa senkron bozulmuş demektir.
   */
  it('kullanıcının el hesabını yeniden üretir', () => {
    const bare = {
      ...DEFAULT_PRICE_BOOK,
      edgeBand: { pricePerM: 0, appliedTo: 'visible' as const },
      hardware: {
        hinge: { pricePerUnit: 0, countByDoorHeight: [] },
        handle: { pricePerUnit: 0 },
        drawer: { pricePerUnit: 0 },
        rail: { pricePerM: 0 },
      },
      labour: { method: 'perM2' as const, perM2: 0 },
      margin: { multiplier: 1 },
      vat: { rate: 0, included: false },
      backPanels: DEFAULT_PRICE_BOOK.backPanels.map((panel) => ({
        ...panel,
        pricePerM2: 0,
      })),
    };

    const config = {
      ...service.defaultConfig('gardirop'),
      height: 180,
      depth: 60,
      sectionCount: 1,
      material: 'mdf-gloss',
      doorType: 'yok',
      sections: [{ width: 56.4, shelves: [], rails: [], drawers: 0 }],
    };

    const result = service.quote('gardirop', config, bare);

    expect(result.price.total).toBeCloseTo(5760, 6);
  });

  it('geçersiz malzeme kimliği 400 verir, sessizce düşmez', () => {
    const config = { ...gardirop(), material: 'altin' };

    expect(() => service.quote('gardirop', config, DEFAULT_PRICE_BOOK)).toThrow(
      BadRequestException,
    );
  });
});
