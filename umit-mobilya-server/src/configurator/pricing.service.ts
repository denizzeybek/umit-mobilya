import { BadRequestException, Injectable } from '@nestjs/common';

import { selectionOf } from './generated/pricing/config';
import { priceOf } from './generated/pricing/priceOf';
import { gardiropParts } from './generated/products/gardirop/parts';
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
 * Varsayılan bölüm ürüne göre değişiyor ve `options.ts` istemcide kaldı
 * (panel metinleri ve hazır düzenlerle birlikte). Sunucunun ihtiyacı olan tek
 * şey fiyatlanabilir bir taban; onu fiyat kitabının ürün ayarlarından kuruyor.
 */
const SECTION_SEED: Record<string, Record<string, unknown>> = {
  gardirop: { shelves: [35, 120], rails: [42], drawers: 0 },
  vestiyer: {
    benchFromFloor: 45,
    shoeShelves: 2,
    shelves: [30],
    hookRail: 60,
  },
};

@Injectable()
export class PricingService {
  productTypes(): string[] {
    return Object.keys(PARTS);
  }

  defaultConfig(productType: string, book: IPriceBook): IBaseConfig {
    const settings = book.products[productType];
    if (!PARTS[productType] || !settings) {
      throw new BadRequestException(`Bilinmeyen ürün tipi: ${productType}`);
    }

    const width = Math.min(180, settings.width.max);
    const sectionCount = 2;
    const bay =
      Math.round(((width - 2 * sectionCount * 1.8) / sectionCount) * 100) / 100;

    return {
      width,
      height: Math.min(220, settings.height.max),
      depth: Math.min(60, settings.depth.max),
      sectionCount,
      material: settings.defaultMaterial,
      finish: book.finishes[0]?.id ?? 'beyaz',
      backPanel: book.backPanels[0]?.id ?? 8,
      doorType: settings.defaultDoorType,
      doorOpen: 0,
      sections: Array.from({ length: sectionCount }, () => ({
        width: bay,
        ...SECTION_SEED[productType],
      })),
    } as IBaseConfig;
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
