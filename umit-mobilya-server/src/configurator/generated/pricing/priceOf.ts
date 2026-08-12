/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.
 * Kaynak: umit-mobilya-client/src/views/configurator/_etc/
 * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing
 */
import { areaOf, edgeLengthOf } from './areaOf';

import type {
  ILabour,
  IPriceBook,
  IPriceBreakdown,
  IPriceLine,
} from './priceBook';
import type { IPart } from './types';

/**
 * Parça listesi + fiyat kitabı -> para. Parça listesi "ne var", fiyat kitabı
 * "kaça" sorusunun cevabı; bu dosya ikisini çarpar ve başka hiçbir şey bilmez.
 *
 * Gizli kalemler (arkalık, marj) toplamda vardır ama dökümde satır açmaz.
 * Bu yüzden gösterilen satırların toplamı toplamla TUTMAZ — bilinçli.
 */

export interface ISelection {
  material: string;
  finish: string;
  doorType: string;
  backPanel: number;
}

interface ICostLine {
  label: string;
  amount: number;
  hidden: boolean;
}

const lookup = <T extends { id: string | number }>(
  list: T[],
  id: string | number,
  what: string,
): T => {
  const found = list.find((item) => item.id === id);
  if (found) return found;

  /*
   * Sessizce ilk kayda düşmek eski davranıştı ve yanlış malzemeyle fiyat
   * vermek, hata vermekten kötü: kimse fark etmez.
   */
  throw new Error(`Fiyat kitabında ${what} bulunamadı: ${String(id)}`);
};

const labourOf = (labour: ILabour, panelM2: number, materialCost: number): number => {
  const flat = labour.assemblyFlat ?? 0;

  if (labour.method === 'perHour') {
    return panelM2 * (labour.hoursPerM2 ?? 0) * (labour.hourlyRate ?? 0) + flat;
  }
  if (labour.method === 'percentOfMaterial') {
    return (materialCost * (labour.percentOfMaterial ?? 0)) / 100 + flat;
  }

  return panelM2 * (labour.perM2 ?? 0) + flat;
};

const panelCost = (
  part: IPart,
  book: IPriceBook,
  selection: ISelection,
): number => {
  const area = areaOf(part, book.areaConvention) * part.qty;
  if (area <= 0) return 0;

  if (part.materialRole === 'back') {
    return area * lookup(book.backPanels, selection.backPanel, 'arkalık').pricePerM2;
  }

  const material = lookup(book.materials, selection.material, 'malzeme');
  const finish = lookup(book.finishes, selection.finish, 'kaplama');
  let cost = area * (material.pricePerM2 + finish.surchargePerM2);

  if (part.materialRole === 'door') {
    cost += area * lookup(book.doorTypes, selection.doorType, 'kapak tipi').pricePerM2;
  }

  return cost;
};

const hardwareCost = (part: IPart, book: IPriceBook): number => {
  const { hinge, handle, drawer, rail } = book.hardware;

  if (part.kind === 'mentese') return part.qty * hinge.pricePerUnit;
  if (part.kind === 'kulp') return part.qty * handle.pricePerUnit;
  if (part.kind === 'cekmece') return part.qty * drawer.pricePerUnit;
  if (part.kind === 'askilik') {
    return part.qty * (part.lengthM ?? 0) * rail.pricePerM;
  }

  return 0;
};

const accumulate = (into: Map<string, ICostLine>, line: ICostLine): void => {
  const existing = into.get(line.label);
  if (existing) {
    existing.amount += line.amount;
    return;
  }
  into.set(line.label, { ...line });
};

export const priceOf = (
  parts: IPart[],
  book: IPriceBook,
  selection: ISelection,
): IPriceBreakdown => {
  const costs = new Map<string, ICostLine>();
  const wasteFactor = 1 + book.waste.percent / 100;

  let panelM2 = 0;
  let materialCost = 0;
  let edgeM = 0;

  for (const part of parts) {
    if (part.partClass === 'panel') {
      const cost = panelCost(part, book, selection) * wasteFactor;
      materialCost += cost;
      panelM2 += areaOf(part, book.areaConvention) * part.qty;
      edgeM += edgeLengthOf(part, book.edgeBand.appliedTo, book.areaConvention) * part.qty;
      accumulate(costs, { label: part.label, amount: cost, hidden: !!part.hidden });
      continue;
    }

    accumulate(costs, {
      label: part.label,
      amount: hardwareCost(part, book),
      hidden: !!part.hidden,
    });
  }

  if (edgeM > 0) {
    accumulate(costs, {
      label: 'Kenar bandı',
      amount: edgeM * book.edgeBand.pricePerM,
      hidden: false,
    });
  }

  const labour = labourOf(book.labour, panelM2, materialCost);
  if (labour > 0) {
    accumulate(costs, { label: 'İşçilik', amount: labour, hidden: false });
  }

  if (book.delivery.enabled && book.delivery.flat > 0) {
    accumulate(costs, {
      label: book.delivery.label,
      amount: book.delivery.flat,
      hidden: false,
    });
  }

  const all = [...costs.values()].filter((line) => line.amount > 0);
  const costTotal = all.reduce((sum, line) => sum + line.amount, 0);

  const netTotal = costTotal * book.margin.multiplier;
  const vat = book.vat.included ? 0 : netTotal * book.vat.rate;

  const lines: IPriceLine[] = all
    .filter((line) => !line.hidden)
    .map((line) => ({ label: line.label, amount: line.amount }));

  return { lines, netTotal, vat, total: netTotal + vat };
};
