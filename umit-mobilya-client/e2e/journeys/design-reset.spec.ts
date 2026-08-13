import { CONFIG_QUERY_KEY } from '../../src/views/configurator/_etc/configUrl';
import { readDimension, setDimension } from '../configurator';
import { expect, test } from '../fixtures';

/**
 * "Tasarımı sıfırla" hem dolabı hem ADRESİ başa döndürmeli.
 *
 * Neden tarayıcıda: sıfırlama tek bir atama değil, router'a bağlı iki yönlü bir
 * eşitleme. Tasarım adrese 300 ms geciktirilerek yazılıyor ve varsayılana
 * dönüldüğünde kod SİLİNİYOR; bu zincir yalnızca gerçek bir gezinmede kuruluyor.
 * Eşitleme tek yönlüyken tam da burası bozuktu: config yerinde kalıyor, sonra
 * yazma yönü kodu adrese geri koyuyordu.
 *
 * Sayı iddiası yok — ölçünün başlangıç değerine dönmesi bir kablolama iddiası,
 * tutar değil (Rule 11).
 */
test('tasarımı sıfırlayınca dolap da adres de başa döner', async ({ page }) => {
  await page.goto('/tasarla/gardirop');

  const initial = await readDimension(page, 'width');

  await setDimension(page, 'width', 260);

  /* Adrese yazma geciktirilmiş: koda değil, kodun BELİRMESİNE bekleniyor. */
  const codeInUrl = (): string | null =>
    new URL(page.url()).searchParams.get(CONFIG_QUERY_KEY);

  await expect.poll(codeInUrl).not.toBeNull();

  await page.getByTestId('reset-design').click();

  await expect.poll(codeInUrl).toBeNull();
  expect(await readDimension(page, 'width')).toBe(initial);
});
