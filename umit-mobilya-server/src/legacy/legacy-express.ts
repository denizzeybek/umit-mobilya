import { Logger } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import type { RequestHandler } from 'express';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const requireLegacy = createRequire(__filename);

/**
 * Mounts the not-yet-ported Express routers inside the Nest app.
 *
 * The migration runs domain by domain (`category` -> `auth` -> `product`), so
 * for a while both stacks answer on the same port. Express middleware added
 * with `app.use()` runs *before* Nest's router, so a domain is handed over by
 * deleting its `router.use(...)` line from `routes/index.js` — the direct
 * successor of the old mount step. Forget that and the legacy handler keeps
 * shadowing the new controller with no error anywhere.
 *
 * Paths resolve from the repository root rather than from `dist/`, so the
 * CommonJS files stay out of the TypeScript build entirely.
 */
export async function mountLegacyExpress(app: INestApplication): Promise<void> {
  const logger = new Logger('LegacyExpress');
  const root = process.cwd();

  const connectLegacyDatabase = requireLegacy(
    join(root, 'configs', 'database.js'),
  ) as () => Promise<void>;

  await connectLegacyDatabase();

  const legacyRoutes = requireLegacy(
    join(root, 'routes', 'index.js'),
  ) as RequestHandler;

  app.use(legacyRoutes);

  logger.log('Taşınmamış Express rotaları bağlandı');
}
