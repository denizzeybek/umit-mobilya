import { BadRequestException, Injectable } from '@nestjs/common';

import { selectionOf } from './generated/pricing/config';
import { priceOf } from './generated/pricing/priceOf';
import { createDefaultConfig as gardiropDefaultConfig } from './generated/products/gardirop/options';
import { gardiropParts } from './generated/products/gardirop/parts';
import { createDefaultConfig as vestiyerDefaultConfig } from './generated/products/vestiyer/options';
import { vestiyerParts } from './generated/products/vestiyer/parts';

import type { IBaseConfig } from './generated/pricing/config';
import type { IPriceBook, IPriceBreakdown } from './generated/pricing/priceBook';
import type { IPart } from './generated/pricing/types';
import type { IGardiropConfig } from './generated/products/gardirop/types';
import type { IVestiyerConfig } from './generated/products/vestiyer/types';

/**
 * Fiyat motorunun sunucudaki yüzü. Hesabın kendisi `generated/` altında ve
 * istemciyle BAYTINA KADAR aynı (`test/pricing-sync.spec.ts`); burası yalnızca
 * ürün tipini doğru parça üreticisine bağlıyor ve motorun attığı hatayı HTTP
 * diline çeviriyor.
 *
 * Motor bilinmeyen bir katalog kimliğinde bilerek `throw` ediyor — yanlış
 * malzemeyle fiyat vermek, hata vermekten kötü. Dışarıya bunun karşılığı 400.
 */
export interface IQuoteComputation {
  parts: IPart[];
  price: IPriceBreakdown;
}

type TPartsFn = (config: IBaseConfig, book: IPriceBook) => IPart[];

const PARTS: Record<string, TPartsFn> = {
  gardirop: (config, book) => gardiropParts(config as IGardiropConfig, book),
  vestiyer: (config, book) => vestiyerParts(config as IVestiyerConfig, book),
};

/**
 * Ürünün KENDİ varsayılan tasarımı — istemcideki `createDefaultConfig`in ta
 * kendisi, `yarn sync:pricing` ile kopyalanmış hâli.
 *
 * Burada bir zamanlar elle kurulmuş bir taban vardı, gerekçesi "options.ts
 * istemcide kaldı" idi. O gerekçe artık geçerli değil — `options.ts` fiyat ağı
 * için sunucuya kopyalanıyor — ve elle kurulmuş taban ÜÇÜNCÜ bir kopyaydı:
 * vestiyerin bölümünü `shelves: [30]` yazıyordu, ürünün gerçeği `[25]`.
 *
 * Kimse fark etmemişti çünkü bu yolu yalnızca spec'ler kullanıyor — ve tehlike
 * tam olarak oradaydı: spec'ler müşterinin hiç görmediği bir tasarımı test
 * ediyor, "varsayılan gardırop fiyatlanıyor" diye yeşil yanıyordu.
 */
const DEFAULTS: Record<string, () => IBaseConfig> = {
  gardirop: gardiropDefaultConfig,
  vestiyer: vestiyerDefaultConfig,
};

@Injectable()
export class PricingService {
  productTypes(): string[] {
    return Object.keys(PARTS);
  }

  /**
   * Ürünün varsayılan tasarımı. BUGÜN hiçbir route bunu çağırmıyor; spec'ler
   * "geçerli bir tasarım" fixture'ı olarak kullanıyor. Yine de ürünün kendi
   * fabrikasından geliyor — yani spec'lerin denediği tasarım, müşterinin
   * konfigüratörü açtığında gördüğünün aynısı.
   *
   * Fiyat kitabı parametresi YOK: `createDefaultConfig` varsayılan malzemesini
   * ve kapak tipini tohum kitaptan okuyor, istemcide de öyle. Yayınlanmış bir
   * kitabın varsayılanları buraya yansımıyor — istemciyle aynı davranış, ve
   * ikisini birden değiştirmek ayrı bir karar.
   */
  defaultConfig(productType: string): IBaseConfig {
    const create = DEFAULTS[productType];
    if (!create) {
      throw new BadRequestException(`Bilinmeyen ürün tipi: ${productType}`);
    }

    return create();
  }

  quote(
    productType: string,
    config: IBaseConfig,
    book: IPriceBook,
  ): IQuoteComputation {
    const partsOf = PARTS[productType];
    if (!partsOf) {
      throw new BadRequestException(`Bilinmeyen ürün tipi: ${productType}`);
    }

    try {
      const parts = partsOf(config, book);
      return { parts, price: priceOf(parts, book, selectionOf(config)) };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Fiyat hesaplanamadı',
      );
    }
  }
}
