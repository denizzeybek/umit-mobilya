import { expect, test } from '../fixtures';

/**
 * Aşağı kaydırırken hangi bölümün düzenlendiği görünür kalmalı.
 *
 * Panelin altındaki üç alan da (kapak kanadı, hazır düzen, özel düzen) SEÇİLİ
 * bölüme uygulanıyor; seçim ekrandan çıkınca kullanıcı hangi bölümde olduğunu
 * unutup yanlış bölümü düzenliyordu.
 *
 * Bunu yalnızca gerçek bir tarayıcı söyleyebilir: `position: sticky` bir
 * yerleşim davranışı ve jsdom'un yerleşim motoru yok — `getBoundingClientRect`
 * orada sıfır döner. Kırılma biçimi de sessiz: bir üst kutu `overflow: hidden`
 * alırsa ya da şerit bir bölümün içine geri taşınırsa sayfa sorunsuz çizilir,
 * şerit sadece kayıp gider.
 */
test('bölüm seçici aşağı kaydırırken görünür kalır', async ({ page }) => {
  await page.goto('/tasarla/gardirop');

  const picker = page.getByTestId('section-picker');

  /*
   * Açılışta şerit zaten katlamanın altında — panelin dördüncü adımı. İddia
   * "her zaman görünür" değil, "AŞAĞI KAYDIRINCA görünür kalır".
   *
   * Panelin en altına kadar in.
   */
  await page.getByTestId('price-total').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('price-total')).toBeInViewport();

  /*
   * Ayırt edici iddia: şeridin ÜSTÜNDE kalan bir bölüm artık görünmüyor ama
   * şerit hâlâ görünüyor. Yalnızca "şerit görünür" demek, sayfanın hiç
   * kaydırılmamış olmasıyla da sağlanabilirdi.
   */
  await expect(page.getByRole('heading', { name: /Malzeme/ })).not.toBeInViewport();
  await expect(picker).toBeInViewport();

  /* Ve kullanılabilir kalıyor: kaydırılmış hâldeyken seçim değiştirilebiliyor. */
  const other = picker.getByRole('button', { name: /Sağ bölüm/ });
  await other.click();
  await expect(other).toHaveAttribute('aria-pressed', 'true');
});
