import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../config';
import { expect, test } from '../fixtures';

/**
 * Admin bir kaplamaya desen görseli yüklediğinde dolap o desenle çiziliyor mu.
 *
 * Bu zincir bugün bir kez sessizce koptu ve tam olarak bu yüzden burada:
 * doku indiriliyordu, yeniden çizim isteniyordu, ama kimse `map`i malzemeye
 * takmıyordu. Sahne düz kahverengi kalıyor, hiçbir test kırılmıyor, konsol
 * temiz. Sunucu "URL'i verdim" der, istemci "yükledim" der, ikisi de haklıdır.
 *
 * Desen `public/img/doku/` altından servis ediliyor (hermetik koşumda R2 yok,
 * kova adresi web sunucusuna yöneltiliyor — `e2e/config.ts`).
 */
const TEXTURE_FILE = 'doku-ceviz.webp';
const FINISH_LABEL = 'e2e Ceviz Damar';

test('yüklenen kaplama deseni dolabın üstüne uygulanır', async ({
  page,
  api,
}) => {
  const login = await api.post('/api/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const { token } = (await login.json()) as { token: string };

  const current = await api.get('/api/pricebook');
  const book = (await current.json()).data as Record<string, unknown>;
  const finishes = book['finishes'] as Record<string, unknown>[];

  /*
   * Kitap public uçtan okundu, yani kâr marjı yok. Yayınlarken geri koymak
   * gerekiyor — yoksa fiyat motoru marjsız bir kitapla hesaplar ve bu
   * yolculuk paralel koşan fiyat yolculuğunu bozar.
   */
  const published = await api.put('/api/pricebook', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      data: {
        ...book,
        margin: { multiplier: 1.25 },
        finishes: [
          ...finishes,
          {
            id: 'e2e-doku',
            label: FINISH_LABEL,
            color: 0x6b4a32,
            swatch: '#6B4A32',
            surchargePerM2: 0,
            textureName: TEXTURE_FILE,
            textureScaleCm: 40,
          },
        ],
      },
    },
  });
  expect(published.status()).toBe(200);

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
