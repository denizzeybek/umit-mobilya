import {
  BACK_PANELS,
  DOOR_STYLES,
  MATERIALS,
} from '../catalog';

import type { TBackPanel, TDoorStyle, TMaterialId } from '../types';

/**
 * Her ürün tipinin paylaştığı fiyat kalemleri: gövde alanı, kapak ve arkalık.
 * Ürüne özel olan iç donanım (raf, tezgâh, oturak) kendi klasöründe hesaplanıp
 * `mergeLines` ile buraya ekleniyor.
 *
 * Fiyat tahminidir, bağlayıcı teklif değildir — rakamlar `wardrobeOptions.ts`
 * içinde tek yerde duruyor ve gerçek maliyetlerle güncellenmeyi bekliyor.
 */
export interface IPriceLine {
  label: string;
  amount: number;
}

export interface IPriceBreakdown {
  lines: IPriceLine[];
  total: number;
}

export interface ICarcassPriceInput {
  width: number;
  height: number;
  depth: number;
  sectionCount: number;
  material: TMaterialId;
  backPanel: TBackPanel;
  doorStyle: TDoorStyle;
}

/**
 * Gövde alanı: iki yan + üst/alt + bölmeler. Arkalık ayrı kalem olduğu için
 * buraya dahil değil.
 */
export const carcassLines = (input: ICarcassPriceInput): IPriceLine[] => {
  const material =
    MATERIALS.find((item) => item.id === input.material) ?? MATERIALS[0];
  const doorStyle =
    DOOR_STYLES.find((item) => item.id === input.doorStyle) ?? DOOR_STYLES[0];
  const backPanel =
    BACK_PANELS.find((item) => item.id === input.backPanel) ?? BACK_PANELS[0];

  const w = input.width / 100;
  const h = input.height / 100;
  const d = input.depth / 100;
  const dividers = Math.max(input.sectionCount - 1, 0);

  const carcassArea = 2 * h * d + 2 * w * d + dividers * h * d;

  return [
    {
      label: `Gövde — ${material.label}`,
      amount: carcassArea * material.pricePerM2,
    },
    {
      label: `Kapak — ${doorStyle.label}`,
      amount: doorStyle.price * input.sectionCount * (h / 2.2),
    },
    {
      label: `Arkalık — ${backPanel.label}`,
      amount: (backPanel.price * (w * h)) / 2,
    },
  ];
};

/**
 * Sıfır tutarlı kalemler düşülür (kapaksız bir dolapta "Kapak — 0 ₺" satırı
 * gürültü), tutarlar yuvarlanır, toplam onluğa çekilir: tahmini bir rakamı
 * kuruşuna kadar göstermek olduğundan kesin gösterir.
 */
export const mergeLines = (
  ...groups: IPriceLine[][]
): IPriceBreakdown => {
  const lines = groups
    .flat()
    .filter((line) => line.amount > 0)
    .map((line) => ({ ...line, amount: Math.round(line.amount) }));

  const total = lines.reduce((sum, line) => sum + line.amount, 0);

  return { lines, total: Math.round(total / 10) * 10 };
};
