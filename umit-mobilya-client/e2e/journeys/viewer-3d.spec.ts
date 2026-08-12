import { setDimension } from '../configurator';
import { expect, test } from '../fixtures';

/**
 * 3B görüntüleyicinin iki dalı da yalnızca gerçek bir tarayıcıda görülebilir:
 * WebGL varsa sahne çizilmeli, yoksa "önizleme görüntülenemiyor" metni
 * belirmeli. jsdom'da ikisi de yok.
 *
 * Kanıt olarak çizim çağrıları sayılıyor. Ekran görüntüsü karşılaştırması
 * BİLİNÇLİ OLARAK yok: GPU'ya, sürücüye ve kenar yumuşatmaya bağlı, makineden
 * makineye değişir ve ilk yeşil koşumdan sonra kapatılan bir teste dönüşür.
 * Geometrinin kendisi `_etc/geometry/*.spec.ts`'te saf fonksiyon olarak test
 * ediliyor (Rule 11 §2.8).
 */
declare global {
  interface Window {
    __e2eDrawCalls?: number;
  }
}

const drawCallsOf = (): number => window.__e2eDrawCalls ?? 0;

test('dolap 3B çiziliyor ve ölçü değişince yeniden çiziliyor', async ({ page }) => {
  /*
   * Three.js'in çizim çağrıları sayılıyor. Piksel okumak burada işe yaramaz:
   * renderer `preserveDrawingBuffer` olmadan kuruluyor, yani kare
   * sunulduktan sonra tampon boş.
   */
  await page.addInitScript(() => {
    window.__e2eDrawCalls = 0;

    const bump = (): void => {
      window.__e2eDrawCalls = (window.__e2eDrawCalls ?? 0) + 1;
    };

    const gl1 = WebGLRenderingContext.prototype;
    const draw1 = gl1.drawElements;
    gl1.drawElements = function patched(mode, count, type, offset) {
      bump();
      return draw1.call(this, mode, count, type, offset);
    };

    const gl2 = WebGL2RenderingContext.prototype;
    const draw2 = gl2.drawElements;
    gl2.drawElements = function patched(mode, count, type, offset) {
      bump();
      return draw2.call(this, mode, count, type, offset);
    };
  });

  await page.goto('/tasarla/gardirop');

  const canvas = page.getByTestId('viewer-canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByTestId('viewer-fallback')).toHaveCount(0);

  /* Sahne bir kere çizildi mi — kurulan ama hiç render edilmeyen bir sahne
   * ekranda boş bir canvas olarak duruyordu ve hiçbir şey ötmüyordu. */
  await expect.poll(() => page.evaluate(drawCallsOf)).toBeGreaterThan(0);

  const before = await page.evaluate(drawCallsOf);

  await setDimension(page, 'width', 300);

  await expect
    .poll(() => page.evaluate(drawCallsOf))
    .toBeGreaterThan(before);
});

/*
 * Bağlam alınamadığında Three.js kendi hata satırını konsola basıyor. Bu
 * senaryonun ta kendisi olduğu için nöbetçiye açıkça tanıtılıyor — genel bir
 * susturma değil, bu testin beklediği tek satır.
 */
test.describe(() => {
  test.use({ allowedConsoleErrors: [/THREE\.WebGLRenderer: Error creating WebGL context/] });

  test('WebGL yoksa görüntüleyici yerine açıklama gösteriliyor', async ({ page }) => {
  /*
   * Kurumsal politika, eski cihaz ya da kapalı donanım hızlandırmasının
   * karşılığı: bağlam alınamıyor. `useThreeScene` bunu yakalayıp `supported`
   * bayrağını düşürüyor — eskiden geriye kırık, boş bir canvas kalıyordu ve
   * kullanıcı sayfanın tamamının bozuk olduğunu sanıyordu.
   */
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;

      HTMLCanvasElement.prototype.getContext = function patched(
        this: HTMLCanvasElement,
        contextId: string,
        options?: unknown,
      ) {
        /*
         * `includes`, `startsWith` DEĞİL: Three.js sırayla 'webgl2', 'webgl' ve
         * 'experimental-webgl' deniyor. Sonuncusu "webgl" ile BAŞLAMIYOR, ve
         * startsWith ile yazıldığında sessizce gerçek bir WebGL 1 bağlamı
         * alıyordu — test yedeği hiç görmeden geçiyordu.
         */
        if (contextId.includes('webgl')) return null;
        return Reflect.apply(original, this, [contextId, options]);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });

    await page.goto('/tasarla/gardirop');

    await expect(page.getByTestId('viewer-fallback')).toBeVisible();
    await expect(
      page.getByText('Tarayıcın 3B görüntülemeyi desteklemiyor'),
    ).toBeVisible();

    /* Kayıp olan yalnızca görsel: ölçü ve fiyat çalışmaya devam etmeli. */
    await expect(page.getByTestId('price-total')).toBeVisible();
  });
});
