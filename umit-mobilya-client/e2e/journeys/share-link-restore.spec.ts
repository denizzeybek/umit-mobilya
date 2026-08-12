import {
  CONFIG_QUERY_KEY,
  decodeConfig,
} from '../../src/views/configurator/_etc/configUrl';
import { readDimension, setDimension, shownTotal } from '../configurator';
import { expect, test } from '../fixtures';

/**
 * "Bağlantı ölçülerini ve seçimlerini taşır — açan kişi tam olarak bu tasarımı
 * görür." Panel bunu kullanıcıya yazıyor; bu yolculuk sözün tutulduğunu
 * kanıtlıyor.
 *
 * Neden tarayıcıda: kodlama `btoa`/`atob` ile yapılıyor, adrese yazma 300 ms
 * geciktirilmiş, ve geri yükleme router sorgusundan `sanitizeConfig`e uzanan
 * bir zincir. `configUrl.spec.ts` kodlayıcıyı tek başına test ediyor; zincirin
 * kurulu olduğunu yalnızca gerçek bir gezinme gösterebilir.
 *
 * Pano (`navigator.clipboard`) bilerek kullanılmıyor: yalnızca güvenli
 * bağlamda çalışıyor ve testin konusu kopyalama değil, bağlantının taşıdığı
 * tasarım.
 */
test('paylaşılan bağlantı aynı tasarımı geri yükler', async ({ page, context }) => {
  await page.goto('/tasarla/gardirop');

  await setDimension(page, 'width', 260);
  await setDimension(page, 'height', 200);

  /*
   * Adrese yazma 300 ms geciktirilmiş (her kaydırıcı karesinde geçmişe yazmamak
   * için). `c=` VAR OLDUĞUNDA beklemeyi kesmek yetmiyor: ilk yazma yalnızca
   * genişliği taşıyordu ve test bir önceki tasarımın bağlantısını paylaşıyordu.
   * O yüzden kodun İÇİNDEKİ değere kadar bekleniyor — süreye değil, koşula.
   */
  const heightInUrl = (): number | undefined => {
    const raw = new URL(page.url()).searchParams.get(CONFIG_QUERY_KEY);
    const decoded = decodeConfig(raw);

    return (decoded?.c as { height?: number } | undefined)?.height;
  };

  await expect.poll(heightInUrl).toBe(200);

  const shared = page.url();
  const expectedTotal = await shownTotal(page);

  const opened = await context.newPage();
  await opened.goto(shared);

  await expect(opened.getByTestId('configurator')).toBeVisible();
  expect(await readDimension(opened, 'width')).toBe(260);
  expect(await readDimension(opened, 'height')).toBe(200);
  expect(await shownTotal(opened)).toBe(expectedTotal);

  await opened.close();
});
