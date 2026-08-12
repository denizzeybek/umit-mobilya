import type { IPart } from './types';

/**
 * Spec'lerin paylaştığı parça kurucuları. Ayrı dosyada, çünkü iki spec de
 * (kalemler ve gövde aritmetiği) aynı kurulumu istiyor ve kopyalanan bir
 * kurulum ikisinden birinde sessizce eskir.
 */
export const doorPart = (extra: Partial<IPart> = {}): IPart => ({
  kind: 'kapak',
  partClass: 'panel',
  moduleIndex: 0,
  materialRole: 'door',
  label: 'Kapak',
  qty: 1,
  size: { w: 60, h: 180, d: 1.8 },
  grossSize: { w: 60, h: 180, d: 1.8 },
  ...extra,
});

export const hardwarePart = (
  kind: IPart['kind'],
  qty: number,
  extra: Partial<IPart> = {},
): IPart => ({
  kind,
  partClass: 'hardware',
  moduleIndex: 0,
  label: kind,
  qty,
  ...extra,
});

export const backPart = (extra: Partial<IPart> = {}): IPart => ({
  kind: 'arkalik',
  partClass: 'panel',
  moduleIndex: 0,
  materialRole: 'back',
  label: 'Arkalık',
  qty: 1,
  hidden: true,
  size: { w: 60, h: 180, d: 0.8 },
  grossSize: { w: 60, h: 180, d: 0.8 },
  ...extra,
});

export const shelfPart = (extra: Partial<IPart> = {}): IPart => ({
  kind: 'raf',
  partClass: 'panel',
  moduleIndex: 0,
  materialRole: 'carcass',
  label: 'Raflar',
  qty: 1,
  size: { w: 56.4, h: 1.8, d: 55 },
  grossSize: { w: 56.4, h: 1.8, d: 55 },
  bandedEdgeM: 0.564,
  ...extra,
});
