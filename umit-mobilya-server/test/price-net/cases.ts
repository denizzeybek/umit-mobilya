import { panelThicknessOf } from '../../src/configurator/generated/pricing/moduleLayout';

import type { IBaseConfig } from '../../src/configurator/generated/pricing/config';
import type { IPriceBook } from '../../src/configurator/generated/pricing/priceBook';
import type { IGardiropSection } from '../../src/configurator/generated/products/gardirop/types';
import type { IVestiyerSection } from '../../src/configurator/generated/products/vestiyer/types';

/**
 * Fiyat ağının kanonik tasarımları.
 *
 * Liste bilerek kısa: her case bir golden dosyası, her golden bir bakım yükü.
 * Yeni bir case'in yanında hangi kırılmayı yakalayacağı yazılı olmalı;
 * yazılamıyorsa o bir vitest testidir, golden değil (Rule 13 §7.5).
 *
 * Ölçüler kataloğun kendi sınırlarından okunuyor, elle yazılmış sayılardan
 * değil: katalog değişince case onunla birlikte hareket eder ve golden diff'i
 * "sınır değişti" ile "fiyat kaydı"nı ayırt edilebilir tutar.
 */
export interface IPriceCase {
  /** Golden dosyasının adı. */
  id: string;
  /** Tasarımı anlatır, kimliği değil — hata raporunda okunan şey budur. */
  title: string;
  /** Bu case hangi kırılmayı yakalar. */
  guards: string;
  productType: string;
  config: IBaseConfig;
}

/**
 * Bölüm genişliği: kullanıcının panele girdiği İÇ ölçü. Dış genişlik buna iki
 * yan panel ekliyor, o yüzden n modül tam olarak `width`e otursun diye panel
 * kalınlığı düşülüyor. Kalınlık kataloğdan okunuyor; sabit yazmak kitabı
 * değiştiren birinin farkında olmayacağı bir ayrışma üretirdi.
 */
const bayWidth = (
  totalWidth: number,
  sectionCount: number,
  book: IPriceBook,
  materialId: string,
): number => {
  const material = book.materials.find((item) => item.id === materialId);
  if (!material) throw new Error(`Katalogda yok: ${materialId}`);

  const thickness = panelThicknessOf(material.thicknessMm);
  const inner = (totalWidth - 2 * sectionCount * thickness) / sectionCount;

  return Math.round(inner * 100) / 100;
};

interface IShape {
  width: number;
  height: number;
  depth: number;
  sectionCount: number;
  material: string;
  doorType: string;
  backPanel: number;
}

const baseOf = (shape: IShape): Omit<IBaseConfig, 'sections'> => ({
  width: shape.width,
  height: shape.height,
  depth: shape.depth,
  sectionCount: shape.sectionCount,
  material: shape.material,
  finish: 'beyaz',
  backPanel: shape.backPanel,
  doorType: shape.doorType,
  doorOpen: 0,
});

const gardiropSections = (
  shape: IShape,
  book: IPriceBook,
  interior: { shelves: number[]; rails: number[]; drawers: number },
): IGardiropSection[] =>
  Array.from({ length: shape.sectionCount }, () => ({
    width: bayWidth(shape.width, shape.sectionCount, book, shape.material),
    ...interior,
  }));

const vestiyerSections = (
  shape: IShape,
  book: IPriceBook,
): IVestiyerSection[] =>
  Array.from({ length: shape.sectionCount }, () => ({
    width: bayWidth(shape.width, shape.sectionCount, book, shape.material),
    benchFromFloor: 45,
    shoeShelves: 2,
    shelves: [30],
    hookRail: 60,
  }));

export const priceCases = (book: IPriceBook): IPriceCase[] => {
  const gardirop = book.products['gardirop'];
  const vestiyer = book.products['vestiyer'];
  if (!gardirop || !vestiyer) throw new Error('Katalogda ürün ayarı yok.');

  const standart: IShape = {
    width: 180,
    height: 220,
    depth: 60,
    sectionCount: 2,
    material: gardirop.defaultMaterial,
    doorType: gardirop.defaultDoorType,
    backPanel: 8,
  };

  const genis: IShape = {
    width: gardirop.width.max,
    height: gardirop.height.max,
    depth: 60,
    sectionCount: 4,
    material: 'lak-panel',
    doorType: 'standart',
    backPanel: 18,
  };

  const dar: IShape = {
    width: gardirop.width.min,
    height: gardirop.height.min,
    depth: gardirop.depth.min,
    sectionCount: 1,
    material: gardirop.defaultMaterial,
    doorType: 'yok',
    backPanel: 4,
  };

  const kose: IShape = {
    width: 240,
    height: 220,
    depth: 60,
    sectionCount: 3,
    material: gardirop.defaultMaterial,
    doorType: gardirop.defaultDoorType,
    backPanel: 8,
  };

  const vestiyerStandart: IShape = {
    width: 120,
    height: 200,
    depth: 35,
    sectionCount: 2,
    material: vestiyer.defaultMaterial,
    doorType: vestiyer.defaultDoorType,
    backPanel: 8,
  };

  const vestiyerGenis: IShape = {
    width: vestiyer.width.max,
    height: vestiyer.height.max,
    depth: vestiyer.depth.max,
    sectionCount: vestiyer.sectionCount.max,
    material: 'akrilik',
    doorType: vestiyer.defaultDoorType,
    backPanel: 18,
  };

  return [
    {
      id: 'gardirop-standart',
      title: '180 x 220 x 60, iki bölüm, kulpsuz kapak, MDF High Gloss',
      guards:
        'Gövde, kapak, raf, askılık ve işçiliğin gündelik yolu — motorun ana hattı.',
      productType: 'gardirop',
      config: {
        ...baseOf(standart),
        sections: gardiropSections(standart, book, {
          shelves: [35, 120],
          rails: [42],
          drawers: 0,
        }),
      },
    },
    {
      id: 'gardirop-genis-cekmeceli',
      title: 'Katalog tavanı genişlik ve yükseklik, dört bölüm, çekmeceli',
      guards:
        'Modül bölünmesi, kanat tavanı (maxDoorLeafWidthCm) ve kanat yüksekliğine ' +
        'göre menteşe adedi; çekmecenin adet üstünden fiyatlanması.',
      productType: 'gardirop',
      config: {
        ...baseOf(genis),
        sections: gardiropSections(genis, book, {
          shelves: [40, 90],
          rails: [50],
          drawers: 3,
        }),
      },
    },
    {
      id: 'gardirop-kapaksiz-dar',
      title: 'Katalog tabanı ölçüler, tek bölüm, kapaksız',
      guards:
        'Kapaksız yol: menteşe, kulp ve kapak kenar bandı kalemleri OLUŞMAMALI. ' +
        'Sıfır kalem üreten dallar, sessizce fiyat eklemeye en açık olanlar.',
      productType: 'gardirop',
      config: {
        ...baseOf(dar),
        sections: gardiropSections(dar, book, {
          shelves: [30, 60, 90],
          rails: [],
          drawers: 0,
        }),
      },
    },
    {
      id: 'gardirop-kose-modullu',
      title: '240 x 220 x 60, üç bölüm, üçüncüsü köşe modülü',
      guards:
        'Köşe modülünün tutara etkisi. Bugün NÖTR (cornerSurchargePercent 0), ' +
        'yani bu golden düz üç bölümlü dolapla aynı sayıyı taşıyor — katsayı ' +
        'gerçek imalat farkına çekildiğinde kaymak ZORUNDA, ve kaymazsa köşe ' +
        'bayrağı fiyata hiç ulaşmıyor demektir.',
      productType: 'gardirop',
      config: {
        ...baseOf(kose),
        /*
         * Üç eşit modül, üçüncüsü köşe. Köşe modülünün genişliği diğerleriyle
         * aynı çünkü o ölçü artık KAPAK YÜZÜ genişliği; planda kapladığı kare
         * ondan ve derinlikten türüyor.
         */
        sections: gardiropSections(kose, book, {
          shelves: [35, 120],
          rails: [42],
          drawers: 0,
        }).map((section, index) =>
          index === 2 ? { ...section, corner: true } : section,
        ),
      },
    },
    {
      id: 'vestiyer-standart',
      title: '120 x 200 x 35, iki bölüm, kapaksız vestiyer',
      guards:
        'Tamamen ayrı bir parça üreticisi: oturak, ayakkabılık ve askı çıtası. ' +
        'Gardıropta yapılan bir değişikliğin buraya sızmadığının kanıtı.',
      productType: 'vestiyer',
      config: {
        ...baseOf(vestiyerStandart),
        sections: vestiyerSections(vestiyerStandart, book),
      },
    },
    {
      id: 'vestiyer-genis-bes-bolum',
      title: 'Katalog tavanı vestiyer, beş bölüm, akrilik',
      guards:
        'Bölüm sayısı tavanı ve pahalı malzemenin marj + KDV ile birleşimi — ' +
        'toplamın büyük sayılarda da doğru çarpıldığı.',
      productType: 'vestiyer',
      config: {
        ...baseOf(vestiyerGenis),
        sections: vestiyerSections(vestiyerGenis, book),
      },
    },
  ];
};
