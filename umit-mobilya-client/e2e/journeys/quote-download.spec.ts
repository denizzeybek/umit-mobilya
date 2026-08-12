import { expect, test } from '../fixtures';

/**
 * Düğmenin üstünde "Teklifi İndir" yazıyorsa dosya inmeli.
 *
 * İndirme, form gönderildikten SONRA — yani bir `await`in ardından — sentetik
 * bir `<a>` tıklamasıyla başlıyor. Tarayıcılar kullanıcı hareketi zincirini
 * orada koparabiliyor, açılır pencere engelleyicileri de araya girebiliyor.
 * Sessizce kırıldığında geriye "indirme başladı" yazan ama hiçbir şey inmemiş
 * bir ekran kalıyor — ve bunu başka hiçbir katman göremez: sunucu belgeyi
 * ürettiğini bilir, istemci indirmeyi tetiklediğini sanır.
 *
 * Belgenin İÇERİĞİ burada denetlenmiyor; tutarlar sunucudaki fiyat ağının,
 * belge biçimi `quote-document.spec.ts`in işi (Rule 11).
 */
test('teklifi indir gerçekten dosya indirir', async ({ page }) => {
  await page.goto('/tasarla/gardirop');

  await page.getByTestId('download-quote').click();
  await page.getByTestId('quote-name').locator('input').fill('E2E Müşteri');
  await page.getByTestId('quote-phone').locator('input').fill('0500 000 00 00');

  const downloading = page.waitForEvent('download');
  await page.getByTestId('quote-submit').click();

  const download = await downloading;
  const code = (await page.getByTestId('quote-code').textContent())?.trim() ?? '';

  /* Dosya adı referans kodunu taşıyor — inen şey BU teklif. */
  expect(download.suggestedFilename()).toContain(code);

  /* Boş bir dosya da "indi" sayılır; belge gerçekten geldi mi. */
  const path = await download.path();
  expect(path).not.toBeNull();
});
