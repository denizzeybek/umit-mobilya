import { expect, test } from '../fixtures';

/**
 * Ana sayfanın 3B hero'su iki dallı ve iki dal da yalnızca gerçek tarayıcıda
 * görülebilir: WebGL varsa dolap kaydırdıkça kuruluyor, yoksa yerinde hero
 * fotoğrafı duruyor. jsdom'da ikisi de yok.
 *
 * Konfigüratörün `viewer-3d` yolculuğu bunu KAPSAMIYOR: orası `useThreeScene`
 * üstünde kurulu ayrı bir sahne, ayrı bir yedek (metin) ve ayrı bir bileşen.
 * Buradaki sahne kaydırmaya bağlı ve yedeği bir görsel.
 *
 * Kanıt olarak çizim çağrıları sayılıyor, piksel değil: renderer
 * `preserveDrawingBuffer` olmadan kuruluyor, yani kare sunulduktan sonra
 * tampon boş. Ekran görüntüsü karşılaştırması da bilerek yok (Rule 11 §2.8).
 */
declare global {
  interface Window {
    __e2eHeroDraws?: number;
  }
}

const drawsOf = (): number => window.__e2eHeroDraws ?? 0;

test('ana sayfadaki dolap 3B kuruluyor ve kaydırınca yeniden çiziliyor', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__e2eHeroDraws = 0;

    const bump = (): void => {
      window.__e2eHeroDraws = (window.__e2eHeroDraws ?? 0) + 1;
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

  await page.goto('/');

  const canvas = page.getByTestId('hero-canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByTestId('hero-poster')).toHaveCount(0);

  /* Kurulan ama hiç çizilmeyen bir sahne ekranda boş bir canvas olarak
   * duruyor ve hiçbir şey ötmüyor. */
  await expect.poll(() => page.evaluate(drawsOf)).toBeGreaterThan(0);

  const before = await page.evaluate(drawsOf);

  /*
   * Asıl iddia bu: montaj KAYDIRMAYA bağlı. Sahne kurulup orada donsaydı
   * yukarıdaki iddia yine geçerdi — bu sayfanın bütün fikri kaydırdıkça
   * dolabın kurulması.
   */
  await page.mouse.wheel(0, 900);

  await expect.poll(() => page.evaluate(drawsOf)).toBeGreaterThan(before);
});

/*
 * Bağlam alınamadığında Three.js kendi hata satırını konsola basıyor. Bu
 * senaryonun ta kendisi olduğu için nöbetçiye açıkça tanıtılıyor.
 */
test.describe(() => {
  test.use({
    allowedConsoleErrors: [/THREE\.WebGLRenderer: Error creating WebGL context/],
  });

  test('WebGL yoksa ana sayfada hero fotoğrafı gösteriliyor', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;

      HTMLCanvasElement.prototype.getContext = function patched(
        this: HTMLCanvasElement,
        contextId: string,
        options?: unknown,
      ) {
        /* `includes`, `startsWith` DEĞİL: 'experimental-webgl' "webgl" ile
         * başlamıyor ve sessizce gerçek bir bağlam veriyordu. */
        if (contextId.includes('webgl')) return null;
        return Reflect.apply(original, this, [contextId, options]);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });

    await page.goto('/');

    await expect(page.getByTestId('hero-poster')).toBeVisible();
    await expect(page.getByTestId('hero-canvas')).toHaveCount(0);
  });
});
