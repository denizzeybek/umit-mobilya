import type { PlaywrightTestConfig } from '@playwright/test';

/**
 * e2e koşumunun tek ortam kaynağı.
 *
 * Buradaki her değer `process.env`'den varsayılanıyla okunuyor. Üç dosyada
 * tekrarlanan bir `localhost:3001`, sessizce ayrışan değerin ta kendisidir —
 * spec'lerde sabit URL yazmak `.claude/hooks/e2e-budget.sh` tarafından
 * engelleniyor, ve bu dosya o yasağın karşılığı olan tek meşru yer.
 *
 * Kural: .claude/rules/11-e2e-conventions.md §2.9
 */
/**
 * e2e kendi portlarında koşar — geliştiricinin `yarn dev`'i 3001'de, API'si
 * 5000/3000'de durabilir ve e2e onlara DOKUNMAZ.
 *
 * Bu, ödenmiş bir dersin karşılığı: `reuseExistingServer` ile 3001 paylaşılınca
 * Playwright geliştiricinin GERÇEK API'sine bakan dev sunucusunu yeniden
 * kullandı, hermetik olma iddiası sessizce buharlaştı ve testler 401 verdi.
 * Ayrı port + `reuseExistingServer: false` bunu yapısal olarak imkânsız kılıyor.
 */
export const WEB_PORT = process.env.E2E_WEB_PORT ?? '3101';

export const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${WEB_PORT}`;

export const API_PORT = process.env.E2E_API_PORT ?? '5055';

/** `VITE_API_URL` gibi `/api` ile biter — `apiClient.ts` bu son eki soyuyor. */
export const API_URL = process.env.E2E_API_URL ?? `http://localhost:${API_PORT}/api`;

/**
 * İstek istemcisinin tabanı — `/api` OLMADAN. Playwright `new URL(path, base)`
 * semantiği kullanıyor, yani `/products` taban yolundaki `/api`'yi siliyordu.
 * Taban köken olunca spec gerçek ucu olduğu gibi yazıyor: `/api/products`.
 */
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'e2e@umit.test';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'e2e-parola';

/**
 * Koşum kendi sunucusunu kendi kaldırıyor: Nest bellek içi bir mongod üstünde,
 * vite de ona bakacak şekilde. Yerel Mongo ya da `.env` gerekmiyor.
 *
 * Bir kapı ancak her makinede koşabiliyorsa kapıdır; ayakta duran bir dev
 * ortamına bağlı e2e, çalıştırılamadığı gün "şimdilik atlayalım" olur.
 */
export const webServers: PlaywrightTestConfig['webServer'] = [
  {
    command: 'yarn --cwd ../umit-mobilya-server e2e:api',
    url: `${API_URL}/pricebook`,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { E2E_API_PORT: API_PORT, E2E_BASE_URL: BASE_URL },
  },
  {
    command: `vite --port ${WEB_PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    /*
     * `--strictPort` bilinçli: port doluysa vite sessizce bir sonrakine kayar
     * ve Playwright başka bir uygulamayı test etmeye başlar. Düşmesi yeğdir.
     */
    env: { VITE_API_URL: API_URL },
  },
];

/**
 * İki config'in paylaştığı her şey. Ayrılan tek şey hangi dosyaların koştuğu
 * ve duvar saati tavanı — bütçenin uygulandığı yer orası.
 */
export const sharedUse: PlaywrightTestConfig['use'] = {
  baseURL: BASE_URL,
  trace: 'on-first-retry',
  video: 'off',
  screenshot: 'only-on-failure',
};
