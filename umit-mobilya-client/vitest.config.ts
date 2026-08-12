import { fileURLToPath } from 'node:url'
import { configDefaults,defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      /*
       * `e2e/*` yetmiyordu: yolculuklar `e2e/journeys/` altında ve tek yıldız
       * alt klasöre inmiyor. Vitest o Playwright spec'lerini toplayıp
       * "test is not defined" ile düşüyordu — kırmızı bar, hiçbir gerçek
       * hataya karşılık gelmeden.
       */
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url))
    }
  })
)
