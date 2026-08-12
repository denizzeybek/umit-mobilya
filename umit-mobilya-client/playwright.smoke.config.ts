import { defineConfig, devices } from '@playwright/test';

import { sharedUse, webServers } from './e2e/config';

/**
 * Smoke: her route bir kez açılır, çizildiği doğrulanır, konsola hata basmadığı
 * kontrol edilir. Tıklama yok.
 *
 * `globalTimeout` bir alarm: bu suite'in çökme biçimi tek bir yavaş test değil,
 * her biri makul görünen küçük eklemeler. 120 saniyeye dayanıyorsa smoke bir
 * etkileşim gezintisine dönüşmüş demektir — tavanı yükseltmek değil, iddiayı
 * doğru katmana indirmek gerekir.
 *
 * Kural: .claude/rules/11-e2e-conventions.md
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'smoke.spec.ts',
  globalTimeout: 120_000,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list']],
  outputDir: './e2e/.results/smoke',
  use: { ...sharedUse, ...devices['Desktop Chrome'] },
  webServer: webServers,
});
