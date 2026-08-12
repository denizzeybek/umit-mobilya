import { expect } from '@playwright/test';

import type { Page } from '@playwright/test';

/**
 * Konfigüratör yolculuklarının paylaştığı okuma/yazma yardımcıları.
 *
 * Burada YALNIZCA etkileşim var, iddia yok (tek istisna: bir yardımcının kendi
 * ön koşulu). İddialar spec'te kalır — yardımcıya taşınan bir `expect`,
 * okuyucunun testin ne kanıtladığını görmesini engeller (Rule 08 §3).
 */

/** Ekranda yazan tutar, sayı olarak: "₺57.760" → 57760. */
export const shownTotal = async (page: Page): Promise<number> => {
  const text = await page.getByTestId('price-total').textContent();
  const digits = (text ?? '').replace(/\D/g, '');

  expect(digits, 'ekranda tutar yok').not.toBe('');
  return Number(digits);
};

/**
 * Panelin bir ölçü alanına yazar.
 *
 * `fill()` BURADA ÇALIŞMAZ ve bu ölçüldü: PrimeVue `InputNumber` değeri kendi
 * durumunda tutup " cm" son ekiyle biçimlendiriyor; `fill` DOM değerini
 * değiştirse de bileşenin modeli 180'de kalıyor, fiyat kıpırdamıyor ve test
 * "değişmedi" diye düşüyor. Tuş tuş yazmak bileşenin kendi tuş işleyicisinden
 * geçen tek yol.
 */
export const setDimension = async (
  page: Page,
  axis: 'width' | 'height' | 'depth',
  value: number,
): Promise<void> => {
  const input = page.getByTestId(`dim-${axis}`).locator('input');

  await input.click();
  await page.keyboard.press('ControlOrMeta+a');
  await input.pressSequentially(String(value));
  await input.blur();
};

export const readDimension = async (
  page: Page,
  axis: 'width' | 'height' | 'depth',
): Promise<number> => {
  const value = await page.getByTestId(`dim-${axis}`).locator('input').inputValue();

  return Number(value.replace(/\D/g, ''));
};
