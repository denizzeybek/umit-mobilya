import { expect, test } from './fixtures';
import { ADMIN_ROUTES, PUBLIC_ROUTES } from './routes';

/**
 * Bütün route'lar açılıyor mu.
 *
 * Her route için üç şey: doğru route çözüldü mü (sekme başlığı), kabuk çizildi
 * mi, ve konsola hata bastı mı (`fixtures.ts`'teki nöbetçi otomatik).
 *
 * Tıklama YOK. Bu spec'i bir etkileşim gezintisine çevirmek, kuralın
 * engellemek için var olduğu çöküşün ta kendisi.
 *
 * Kural: .claude/rules/11-e2e-conventions.md
 */
test.describe('smoke — bütün ekranlar açılıyor', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.path} açılıyor`, async ({ page }) => {
      await page.goto(route.path);

      await expect(page).toHaveTitle(route.title);

      const main = page.getByTestId('app-main');
      await expect(main).toBeVisible();
      await expect(main).not.toBeEmpty();

      if (route.testId) {
        await expect(page.getByTestId(route.testId)).toBeVisible();
      }
    });
  }

  for (const route of ADMIN_ROUTES) {
    test(`${route.path} oturumla açılıyor`, async ({ adminPage }) => {
      await adminPage.goto(route.path);

      await expect(adminPage).toHaveTitle(route.title);
      await expect(adminPage.getByTestId(route.testId ?? 'app-main')).toBeVisible();
    });
  }

  /*
   * Guard'ın karşı yönü. Bir yönlendirme hatası burada görünür: token yokken
   * yönetim ekranının AÇILMASI da, ana sayfaya düşmemesi de aynı derecede
   * bozuk — ve ikisi de type-check'ten geçer.
   */
  test('oturumsuz yönetim adresi ana sayfaya düşer', async ({ page }) => {
    await page.goto(ADMIN_ROUTES[0].path);

    await expect(page).toHaveURL(new RegExp(`${'/'}$`));
    await expect(page.getByTestId('app-main')).toBeVisible();
  });

  /*
   * Tek parametreli route. Kimlik tohum veriden okunuyor, spec'e yazılmıyor:
   * sabit bir ObjectId burada ve `e2e-api.ts`'te iki ayrı tarif olurdu.
   */
  test('/product-details/:id açılıyor', async ({ page, api }) => {
    const response = await api.get('/api/products');
    expect(response.status()).toBe(201);

    const products = (await response.json()) as { _id: string }[];
    expect(products.length).toBeGreaterThan(0);

    await page.goto(`/product-details/${products[0]._id}`);

    await expect(page.getByTestId('app-main')).toBeVisible();
    await expect(page.getByTestId('app-main')).not.toBeEmpty();
  });
});
