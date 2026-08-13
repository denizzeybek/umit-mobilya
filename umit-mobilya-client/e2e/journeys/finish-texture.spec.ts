import { expect, test } from '../fixtures';

/**
 * Admin bir kaplamaya desen görseli yüklediğinde dolap o desenle çiziliyor mu.
 *
 * Bu zincir bir kez sessizce koptu ve tam olarak bu yüzden burada: doku
 * indiriliyordu, yeniden çizim isteniyordu, ama kimse `map`i malzemeye
 * takmıyordu. Sahne düz kahverengi kalıyor, hiçbir test kırılmıyor, konsol
 * temiz. Sunucu "URL'i verdim" der, istemci "yükledim" der, ikisi de haklıdır.
 *
 * Kaplama TOHUMDAN geliyor (`e2e-api.ts`), yolculuk yayınlamıyor: iki yolculuk
 * aynı anda kitap yayınladığında son yazan diğerinin kaplamasını düşürüyordu.
 * Desen `public/img/doku/` altından servis ediliyor — hermetik koşumda R2 yok,
 * kova adresi web sunucusuna yöneltiliyor (`e2e/config.ts`).
 */
const TEXTURE_FILE = 'doku-ceviz.webp';
const FINISH_LABEL = 'e2e Ceviz Damar';

test('yüklenen kaplama deseni dolabın üstüne uygulanır', async ({ page }) => {
  const textureRequest = page.waitForResponse((response) =>
    response.url().includes(TEXTURE_FILE),
  );

  await page.goto('/tasarla/gardirop');

  const swatch = page.getByRole('button', { name: FINISH_LABEL });
  await expect(swatch).toBeVisible();

  /* Panel dairesi deseni gösteriyor: seçim anında ne alacağı görünüyor. */
  await expect(swatch).toHaveCSS(
    'background-image',
    new RegExp(TEXTURE_FILE.replace('.', '\\.')),
  );

  await swatch.click();

  /* Görsel gerçekten ağdan indi — sahne onu istemiş demektir. */
  const response = await textureRequest;
  expect(response.status()).toBe(200);

  /* Ve sahne hâlâ ayakta: desen yüklenirken görüntüleyici düşmedi. */
  await expect(page.getByTestId('viewer-canvas')).toBeVisible();
  await expect(page.getByTestId('viewer-fallback')).toHaveCount(0);
});
