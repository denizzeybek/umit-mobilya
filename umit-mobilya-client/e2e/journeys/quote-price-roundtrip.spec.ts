import { setDimension, shownTotal } from '../configurator';
import { expect, test } from '../fixtures';

/**
 * Bu projenin en pahalı sessiz hatası: paneldeki `priceOf()` ile sunucudaki
 * `priceOf()` ayrışır, ekran bir rakam gösterir, admin panelinde başka bir
 * rakam durur, hiçbir test kırılmaz.
 *
 * `pricing-sync.spec.ts` motorun iki kopyasının bayt bayt aynı olduğunu
 * kanıtlıyor; `test/price-net/` tutarların doğru olduğunu. Geriye tek bir
 * soru kalıyor ve onu yalnızca tarayıcı cevaplayabiliyor: EKRANDA GÖRÜLEN
 * TASARIM, sunucuya giden tasarımın aynısı mı?
 *
 * Burada iddia edilen şey KİMLİK, bir tutar değil — sabit bir rakam yazmak
 * aritmetiği tarayıcıya taşımak olurdu ve fiyat kitabı her değiştiğinde sahte
 * kırmızı verirdi (Rule 11).
 */
test('teklif verilince ekrandaki tutar sunucunun hesabıyla aynı', async ({
  page,
  api,
}) => {
  await page.goto('/tasarla/gardirop');

  const total = page.getByTestId('price-total');
  await expect(total).toBeVisible();

  /*
   * Varsayılan tasarımla kalmıyoruz: ölçü değiştirmek hem panelin yeniden
   * hesapladığını, hem de sunucuya GİDEN config'in kullanıcının kurduğu
   * tasarım olduğunu kanıtlıyor. Değişmeyen bir tasarımda ikisi tesadüfen de
   * tutabilirdi.
   */
  const initial = await total.textContent();
  await setDimension(page, 'width', 240);
  await expect(total).not.toHaveText(initial ?? '');

  const displayed = await shownTotal(page);

  await page.getByTestId('request-quote').click();
  await page.getByTestId('quote-name').locator('input').fill('E2E Müşteri');
  await page.getByTestId('quote-phone').locator('input').fill('0500 000 00 00');
  await page.getByTestId('quote-submit').click();

  const code = page.getByTestId('quote-code');
  await expect(code).toBeVisible();
  const reference = (await code.textContent())?.trim() ?? '';

  const response = await api.get(`/api/quotes/${reference}`);
  expect(response.status()).toBe(200);

  const quote = (await response.json()) as {
    price: { total: number };
    config: { width: number };
  };

  /* `PriceSummary.vue` toplamı onluğa çekerek gösteriyor. */
  expect(displayed).toBe(Math.round(quote.price.total / 10) * 10);
  expect(quote.config.width).toBe(240);
});
