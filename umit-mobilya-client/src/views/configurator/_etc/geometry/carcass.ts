import { box } from './primitives';
import { backThicknessOf, T, toMeters } from './units';

import type { IProductMaterials } from './primitives';
import type { Group } from 'three';

/**
 * Gövde kabuğu: iki yan, üst, alt, arkalık ve bölmeler. Kasalı her mobilya
 * tipinde aynı — gardırop, vestiyer, banyo dolabı ve mutfak alt/üst modülleri
 * bu kabuğu paylaşır. Ürüne özel olan, kabuğun İÇİNE ne konduğudur.
 */
export interface ICarcassSpec {
  /** Dış ölçüler, cm. */
  width: number;
  height: number;
  depth: number;
  /** Arkalık kalınlığı, mm. */
  backPanel: number;
  /** Bölümlerin net genişlikleri, cm — soldan sağa. */
  sectionWidths: number[];
}

/** Bir bölümün sahnedeki yeri, metre. */
export interface ISectionLayout {
  width: number;
  start: number;
  end: number;
  center: number;
}

export interface ICarcass {
  layout: ISectionLayout[];
  /** Metre cinsinden dış ölçüler — ürün kodu tekrar çevirmesin diye. */
  W: number;
  H: number;
  D: number;
  back: number;
}

/**
 * Yerleşim soldan sağa yürüyerek çıkarılır: her bölümden sonra bir bölme
 * kalınlığı atlanır. Genişliklerin toplamı gövdeye oturmuyorsa sorumluluk
 * `sectionWidths.ts`'te — burası ne verilirse onu çizer.
 */
export const layoutSections = (spec: ICarcassSpec): ISectionLayout[] => {
  const total = toMeters(spec.width);
  const layout: ISectionLayout[] = [];
  let cursor = -total / 2 + T;

  for (const sectionWidth of spec.sectionWidths) {
    const width = toMeters(sectionWidth);
    layout.push({
      width,
      start: cursor,
      end: cursor + width,
      center: cursor + width / 2,
    });
    cursor += width + T;
  }

  return layout;
};

export const buildCarcass = (
  group: Group,
  materials: IProductMaterials,
  spec: ICarcassSpec,
): ICarcass => {
  const W = toMeters(spec.width);
  const H = toMeters(spec.height);
  const D = toMeters(spec.depth);
  const back = backThicknessOf(spec.backPanel);
  const layout = layoutSections(spec);

  const { panel, interior } = materials;

  group.add(box(panel, T, H, D, -W / 2 + T / 2, H / 2, 0));
  group.add(box(panel, T, H, D, W / 2 - T / 2, H / 2, 0));
  group.add(box(panel, W - 2 * T, T, D, 0, H - T / 2, 0));
  group.add(box(panel, W - 2 * T, T, D, 0, T / 2, 0));
  group.add(box(interior, W, H, back, 0, H / 2, -D / 2 + back / 2));

  for (let i = 0; i < layout.length - 1; i += 1) {
    group.add(box(panel, T, H - 2 * T, D, layout[i].end + T / 2, H / 2, 0));
  }

  return { layout, W, H, D, back };
};
