import { encodeConfig } from '../../src/views/configurator/_etc/configUrl';
import { EProductType } from '../../src/views/configurator/_etc/types';
import { expect, test } from '../fixtures';

import type { IGardiropConfig } from '../../src/views/configurator/_etc/products/gardirop/types';

/**
 * Admin panelinden eklenen bir kaplamayla paylaşılan bağlantı, karşı tarafta
 * AYNI kaplamayı açmalı.
 *
 * Bu, kullanıcının bulduğu hatanın testi ve iki katmanı birden çiviliyor:
 *
 * 1. `sanitizeConfig` katalog kimliklerini TOHUM kitaba göre doğruluyordu;
 *    yalnızca yayınlanmış kitapta olan `e2e-ozel` orada yok, sessizce
 *    varsayılana düşüyordu.
 * 2. Düzeltilse bile config, fiyat kitabı ağdan GELMEDEN kuruluyor — yani ilk
 *    çözümde elde hâlâ tohum kitap var. Katalog geldikten sonra adresin bir kez
 *    daha çözülmesi gerekiyor.
 *
 * İkisi de sessiz: sayfa açılıyor, dolap çiziliyor, konsol temiz — sadece
 * yanlış kaplamayla. Yalnızca gerçek bir tarayıcıda, gerçek bir ağ gecikmesiyle
 * görülebilir, ki bu birim testinin dürüstçe kapatamayacağı yer.
 */
const FINISH_ID = 'e2e-ozel';
const FINISH_LABEL = 'e2e Atölye Yeşili';

test('özel kaplamalı paylaşım bağlantısı aynı kaplamayı açar', async ({
  page,
  api,
}) => {
  const response = await api.get('/api/pricebook');
  const book = (await response.json()).data as {
    products: Record<string, { defaultMaterial: string; defaultDoorType: string }>;
  };
  const settings = book.products['gardirop'];

  const shared: IGardiropConfig = {
    width: 180,
    height: 220,
    depth: 60,
    sectionCount: 2,
    material: settings!.defaultMaterial,
    finish: FINISH_ID,
    backPanel: 8,
    doorType: settings!.defaultDoorType,
    doorOpen: 0,
    sections: [
      { width: 86.4, shelves: [35, 120], rails: [42], drawers: 0 },
      { width: 86.4, shelves: [35, 120], rails: [42], drawers: 0 },
    ],
  };

  await page.goto(
    `/tasarla/gardirop?c=${encodeConfig(EProductType.Gardirop, shared)}`,
  );

  const swatch = page.getByRole('button', { name: FINISH_LABEL });
  await expect(swatch).toBeVisible();

  /*
   * Asıl iddia. Katalog gelmeden önce bu daire seçili DEĞİL; geldikten sonra
   * seçili olmalı — `toHaveAttribute` yeniden denediği için gecikme kendi
   * kendine çözülüyor, sabit bir bekleme gerekmiyor.
   */
  await expect(swatch).toHaveAttribute('aria-pressed', 'true');

  /* Adres de bozulmadan kalmalı: geri yükleme kimliği düşürmemeli. */
  await expect(page).toHaveURL(/c=/);
});
