import { areaOf, edgeLengthOf } from '../src/configurator/generated/pricing/areaOf';
import { selectionOf } from '../src/configurator/generated/pricing/config';
import { DEFAULT_PRICE_BOOK } from '../src/configurator/generated/pricing/defaults';
import { PricingService } from '../src/configurator/pricing.service';
import { priceCases } from '../test/price-net/cases';

import type { IPriceBook } from '../src/configurator/generated/pricing/priceBook';
import type { IPart } from '../src/configurator/generated/pricing/types';

/**
 * Fiyat dökümü — bir tasarımın GİRDİLERİNİ, PARÇALARINI ve ÇIKTISINI yan yana
 * basar. `fiyat-dogrula` skill'inin okuduğu şey budur.
 *
 *   yarn fiyat-acikla                     # 2 kapaklı gardırop (varsayılan)
 *   yarn fiyat-acikla vestiyer-varsayilan
 *   yarn fiyat-acikla --liste
 *
 * Neden ayrı bir araç: "fiyat doğru mu" sorusu iki ayrı soru ve karıştırılınca
 * ikisi de cevaplanamıyor.
 *
 *   1. ARİTMETİK doğru mu — girdilerden bu çıktı çıkar mı? Makine sorusu,
 *      bugün cevaplanır, atölye verisi gerekmez.
 *   2. GİRDİLER doğru mu — işçilik gerçekten m² 350 TL mi? Yalnızca atölye
 *      bilir, ve bu araç onları teyit edilecek bir liste olarak döker.
 *
 * Bu dosya BİLEREK hesap yapmıyor: girdileri ve parçaları ham hâliyle basıyor,
 * çarpmayı skill yapıyor. Aksi hâlde motor kendi kendini onaylamış olurdu —
 * yanlış bir katsayı hem hesapta hem "doğrulamada" aynı yanlış sayıyı verirdi.
 */

const TL = (value: number): string =>
  value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const NUM = (value: number, digits = 4): string =>
  value.toLocaleString('tr-TR', {
    minimumFractionDigits: Math.min(2, digits),
    maximumFractionDigits: digits,
  });

const pad = (label: string, width = 34): string =>
  label + '.'.repeat(Math.max(2, width - label.length));

const heading = (text: string): void => {
  process.stdout.write(`\n${'═'.repeat(72)}\n${text}\n${'═'.repeat(72)}\n`);
};

const line = (text: string): void => {
  process.stdout.write(`${text}\n`);
};

/** Etiket başına toplanmış parça bilgisi — fiyat kalemleri de etikete göre. */
interface IGroup {
  label: string;
  partClass: string;
  materialRole: string;
  qty: number;
  areaM2: number;
  edgeM: number;
  lengthM: number;
  sizes: Set<string>;
  multipliers: Set<number>;
}

const groupParts = (parts: IPart[], book: IPriceBook): IGroup[] => {
  const groups = new Map<string, IGroup>();

  for (const part of parts) {
    const key = part.label;
    const group = groups.get(key) ?? {
      label: part.label,
      partClass: part.partClass,
      materialRole: part.materialRole ?? '—',
      qty: 0,
      areaM2: 0,
      edgeM: 0,
      lengthM: 0,
      sizes: new Set<string>(),
      multipliers: new Set<number>(),
    };

    group.qty += part.qty;
    group.areaM2 += areaOf(part, book.areaConvention) * part.qty;
    group.edgeM +=
      edgeLengthOf(part, book.edgeBand.appliedTo, book.areaConvention) * part.qty;
    group.lengthM += (part.lengthM ?? 0) * part.qty;
    group.multipliers.add(part.costMultiplier ?? 1);

    const size = book.areaConvention === 'gross' ? (part.grossSize ?? part.size) : part.size;
    if (size) {
      group.sizes.add(`${NUM(size.w, 2)}×${NUM(size.h, 2)}×${NUM(size.d, 2)}`);
    }

    groups.set(key, group);
  }

  return [...groups.values()];
};

const main = (): void => {
  const argument = process.argv[2] ?? 'gardirop-varsayilan';
  const cases = priceCases(DEFAULT_PRICE_BOOK);

  if (argument === '--liste') {
    line('Tanımlı referans tasarımlar:');
    for (const item of cases) line(`  ${item.id}  —  ${item.title}`);
    return;
  }

  const scenario = cases.find((item) => item.id === argument);
  if (!scenario) {
    process.stderr.write(
      `Böyle bir tasarım yok: ${argument}\nListe için: yarn fiyat-acikla --liste\n`,
    );
    process.exitCode = 1;
    return;
  }

  const book = DEFAULT_PRICE_BOOK;
  const { config } = scenario;
  const selection = selectionOf(config);
  const { parts, price } = new PricingService().quote(
    scenario.productType,
    config,
    book,
  );

  const material = book.materials.find((item) => item.id === selection.material);
  const finish = book.finishes.find((item) => item.id === selection.finish);
  const doorType = book.doorTypes.find((item) => item.id === selection.doorType);
  const backPanel = book.backPanels.find((item) => item.id === selection.backPanel);
  const settings = book.products[scenario.productType];

  heading(`REFERANS TASARIM · ${scenario.id}`);
  line(scenario.title);
  line('');
  line(`  ürün ................ ${scenario.productType}`);
  line(`  ölçü ................ ${config.width} × ${config.height} × ${config.depth} cm`);
  line(`  bölüm sayısı ........ ${config.sectionCount}`);
  line(`  malzeme ............. ${material?.label ?? '?'}`);
  line(`  kaplama ............. ${finish?.label ?? '?'}`);
  line(`  kapak tipi .......... ${doorType?.label ?? '?'}`);
  line(`  arkalık ............. ${backPanel?.label ?? '?'}`);
  line(`  fiyat kitabı sürümü . ${book.version}  (tohum)`);

  heading('1. GİRDİLER — fiyat kitabında (admin panelinde) yazan');
  line('Bu tasarımın DOKUNDUĞU her rakam. Atölyede teyit edilecek liste bu.');
  line('');
  line(`  ${pad(`Malzeme · ${material?.label} (${material?.thicknessMm} mm)`)} ${TL(material?.pricePerM2 ?? 0)} TL/m²`);
  line(`  ${pad(`Kaplama · ${finish?.label} ek ücret`)} ${TL(finish?.surchargePerM2 ?? 0)} TL/m²`);
  line(`  ${pad(`Kapak tipi · ${doorType?.label}`)} ${TL(doorType?.pricePerM2 ?? 0)} TL/m²`);
  line(`  ${pad(`Arkalık · ${backPanel?.label}`)} ${TL(backPanel?.pricePerM2 ?? 0)} TL/m²   [GİZLİ kalem]`);
  line(`  ${pad('Kenar bandı')} ${TL(book.edgeBand.pricePerM)} TL/m   (${book.edgeBand.appliedTo === 'visible' ? 'yalnızca görünen kenar' : 'bütün çevre'})`);
  line(`  ${pad('Menteşe')} ${TL(book.hardware.hinge.pricePerUnit)} TL/adet`);
  line(`  ${pad('Kulp')} ${TL(book.hardware.handle.pricePerUnit)} TL/adet`);
  line(`  ${pad('Çekmece (ray + malzeme dahil)')} ${TL(book.hardware.drawer.pricePerUnit)} TL/adet`);
  line(`  ${pad('Askılık borusu')} ${TL(book.hardware.rail.pricePerM)} TL/m`);
  line('');
  line('  Menteşe adedi kanat YÜKSEKLİĞİNE göre:');
  for (const step of book.hardware.hinge.countByDoorHeight) {
    const upTo = step.maxHeightCm > 1000 ? 'üstü' : `${step.maxHeightCm} cm'e kadar`;
    line(`    ${pad(upTo, 24)} ${step.count} adet`);
  }
  line('');
  line(`  ${pad(`İşçilik · yöntem "${book.labour.method}"`)} ${TL(book.labour.perM2 ?? 0)} TL/m²`);
  line(`  ${pad('İşçilik · sabit montaj')} ${TL(book.labour.assemblyFlat ?? 0)} TL`);
  line(`  ${pad('Marj çarpanı')} ×${NUM(book.margin.multiplier, 3)}   [GİZLİ — satır açmaz]`);
  line(`  ${pad('KDV')} %${NUM(book.vat.rate * 100, 1)}${book.vat.included ? ' (fiyata dahil)' : ''}`);
  line(`  ${pad('Fire payı')} %${NUM(book.waste.percent, 1)}`);
  line(`  ${pad('Alan konvansiyonu')} ${book.areaConvention === 'gross' ? 'BRÜT (dış ölçü)' : 'NET (kesim ölçüsü)'}`);
  line(`  ${pad('Nakliye')} ${book.delivery.enabled ? `${TL(book.delivery.flat)} TL` : 'kapalı'}`);

  if (settings) {
    line('');
    line(`  Ürün ayarları (${scenario.productType}):`);
    line(`    ${pad('modül genişlik tavanı', 28)} ${settings.maxModuleWidthCm} cm`);
    line(`    ${pad('kapak kanadı tavanı', 28)} ${settings.maxDoorLeafWidthCm} cm`);
    line(`    ${pad('köşe modül farkı', 28)} %${settings.cornerSurchargePercent}`);
  }

  heading('2. PARÇA LİSTESİ — ne imal ediliyor');
  line('Alanlar konvansiyona göre hesaplı; kalem fiyatları BU alanlardan çıkıyor.');
  line('');
  line(
    `  ${'etiket'.padEnd(26)}${'sınıf'.padEnd(10)}${'adet'.padStart(6)}${'alan m²'.padStart(12)}${'bant m'.padStart(10)}${'boy m'.padStart(9)}`,
  );
  line(`  ${'─'.repeat(71)}`);

  const groups = groupParts(parts, book);
  let totalArea = 0;
  let totalEdge = 0;

  for (const group of groups) {
    totalArea += group.areaM2;
    totalEdge += group.edgeM;
    line(
      `  ${group.label.slice(0, 25).padEnd(26)}${group.partClass.padEnd(10)}${String(group.qty).padStart(6)}${NUM(group.areaM2).padStart(12)}${NUM(group.edgeM).padStart(10)}${NUM(group.lengthM).padStart(9)}`,
    );
    const sizes = [...group.sizes];
    if (sizes.length) {
      line(`    ölçü: ${sizes.slice(0, 4).join('  |  ')}${sizes.length > 4 ? `  (+${sizes.length - 4})` : ''}`);
    }
    const multipliers = [...group.multipliers].filter((value) => value !== 1);
    if (multipliers.length) {
      line(`    maliyet çarpanı: ${multipliers.map((m) => `×${NUM(m, 3)}`).join(', ')}`);
    }
  }

  line(`  ${'─'.repeat(71)}`);
  line(`  ${'TOPLAM'.padEnd(42)}${NUM(totalArea).padStart(12)}${NUM(totalEdge).padStart(10)}`);
  line('');
  line('  Not: işçilik bu toplam panel alanını okuyor; kenar bandı bant metrajını.');
  line('  Donanım (menteşe/kulp/çekmece/askılık) alandan DEĞİL adet/metreden fiyatlanır.');

  heading('3. ÇIKTI — motorun ürettiği kalemler (ekranda görünen)');
  for (const item of price.lines) {
    line(`  ${pad(item.label, 40)} ${TL(item.amount).padStart(14)} TL`);
  }
  line(`  ${'─'.repeat(58)}`);
  line(`  ${pad('KDV öncesi (marj dahil, gizli kalemler dahil)', 40)} ${TL(price.netTotal).padStart(14)} TL`);
  line(`  ${pad('KDV', 40)} ${TL(price.vat).padStart(14)} TL`);
  line(`  ${pad('TOPLAM', 40)} ${TL(price.total).padStart(14)} TL`);
  line(`  ${pad('EKRANDA GÖRÜNEN (10 TL yuvarlı)', 40)} ${TL(Math.round(price.total / 10) * 10).padStart(14)} TL`);
  line('');
  line('  DİKKAT: gösterilen kalemlerin toplamı TOPLAM ile tutmaz — bilerek.');
  line('  Arkalık ve marj gizli kalem: toplamda var, dökümde satır açmıyor.');
  line('');
};

main();
