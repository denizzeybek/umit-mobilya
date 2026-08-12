import { defineConfig, devices } from '@playwright/test';

import { sharedUse, webServers } from './e2e/config';

/**
 * Yolculuklar: yalnızca tarayıcıda yaşayan akışlar. Hangi yolculuğun var
 * olabileceğini `e2e/journeys.manifest.ts` belirliyor ve bir hook onu
 * uyguluyor — bu config sadece koşturuyor.
 *
 * `globalTimeout` 300 sn. Tavana yaklaşan bir koşumda yapılacak şey tavanı
 * yükseltmek DEĞİL, sayı iddialarını sunucudaki fiyat ağına indirmek.
 *
 * Kural: .claude/rules/11-e2e-conventions.md
 */
export default defineConfig({
  testDir: './e2e/journeys',
  globalTimeout: 300_000,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list']],
  outputDir: './e2e/.results/journeys',
  use: { ...sharedUse, ...devices['Desktop Chrome'] },
  webServer: webServers,
});
