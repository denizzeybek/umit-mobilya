import { expect, request, test as base } from '@playwright/test';

import { EStorageKeys } from '../src/enums/storageKeys.enum';

import { ADMIN_EMAIL, ADMIN_PASSWORD, API_ORIGIN } from './config';

import type { APIRequestContext, Page } from '@playwright/test';

/**
 * Her spec `test`i BURADAN alır, `@playwright/test`'ten değil — hook bunu
 * uyguluyor. Sebep mekanik: aşağıdaki `consoleGuard` fixture'ı `auto` ve her
 * teste kendiliğinden bağlanıyor. Doğrudan import eden bir spec o nöbetçiyi
 * kaybeder, ve sayfa konsola kırmızı basarken yeşil kalır.
 *
 * Kural: .claude/rules/11-e2e-conventions.md §2.1
 */

/**
 * Testin konusu olmayan gürültü. Liste bilerek kısa ve her satırın nedeni
 * yazılı: geniş bir susturma listesi, nöbetçiyi olmayan bir nöbetçiye çevirir.
 */
const IGNORED_CONSOLE = [
  /favicon/i,
  /Download the Vue Devtools/i,
  /\[vite\] connect/i,
];

const isNoise = (text: string): boolean =>
  IGNORED_CONSOLE.some((pattern) => pattern.test(text));

interface IFixtures {
  consoleGuard: void;
  /**
   * Bu testin BEKLEDİĞİ konsol hataları. Varsayılan boş; bir test ancak
   * hatanın senaryonun kendisi olduğu durumda ve gerekçesiyle ekler —
   * ör. WebGL'i kapatan yolculukta Three.js'in kendi hata satırı.
   *
   * Genel susturma listesi yerine test başına izin: nöbetçi ancak neyin
   * beklendiği açıkça yazıldığında nöbetçi kalır.
   */
  allowedConsoleErrors: RegExp[];
  /** Hermetik API'ye bağlı istemci — hazırlık UI'dan değil buradan yapılır. */
  api: APIRequestContext;
  /** Oturumu kurulmuş sayfa; yönetim ekranları için. */
  adminPage: Page;
}

export const test = base.extend<IFixtures>({
  allowedConsoleErrors: [[], { option: true }],

  consoleGuard: [
    async ({ page, allowedConsoleErrors }, use) => {
      const errors: string[] = [];

      const record = (text: string): void => {
        if (isNoise(text)) return;
        if (allowedConsoleErrors.some((pattern) => pattern.test(text))) return;
        errors.push(text);
      };

      page.on('console', (message) => {
        if (message.type() === 'error') record(message.text());
      });
      page.on('pageerror', (error) => record(String(error)));

      await use();

      expect(errors, 'sayfa konsola hata bastı').toEqual([]);
    },
    { auto: true },
  ],

  api: async ({}, use) => {
    const context = await request.newContext({ baseURL: API_ORIGIN });
    await use(context);
    await context.dispose();
  },

  /**
   * Oturum `localStorage`'a token yazılarak kuruluyor, giriş formu
   * doldurularak değil. Yönetim ekranını test eden bir yolculuk giriş akışını
   * test etmiyor; onu UI'dan geçirmek, konusu olmayan bir akışı testin kırılma
   * yüzeyine sokmak olurdu (§2.5).
   *
   * `addInitScript` bilinçli: router guard'ı ilk gezinmeden ÖNCE token'ı
   * okuyor, sayfa yüklendikten sonra yazmak geç kalırdı.
   */
  adminPage: async ({ page, api }, use) => {
    const response = await api.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });

    expect(response.status(), 'e2e yöneticisi giriş yapamadı').toBe(200);
    const { token } = (await response.json()) as { token: string };

    await page.addInitScript(
      ([key, value]: [string, string]) => {
        window.localStorage.setItem(key, value);
      },
      [EStorageKeys.TOKEN, token] as [string, string],
    );

    await use(page);
  },
});

export { expect } from '@playwright/test';
