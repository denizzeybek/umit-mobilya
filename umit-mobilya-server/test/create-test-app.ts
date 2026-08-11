import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';

import { AppModule } from '../src/app.module';
import { mountLegacyExpress } from '../src/legacy/legacy-express';
import { setupApp } from '../src/setup-app';

/**
 * Boots the whole service the way `main.ts` does — Nest plus whatever is still
 * mounted from `routes/index.js`.
 *
 * Characterization specs go through here rather than through a hand-built
 * Express app, so that porting a domain changes nothing in the spec: the same
 * request hits the legacy handler before the port and the Nest controller
 * after it. If the assertions still pass, the behaviour survived.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  setupApp(app);
  await mountLegacyExpress(app);
  await app.init();

  return app;
}

export function signTestToken(userId = '507f1f77bcf86cd799439011'): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET yok — test/setup-env.ts çalışmamış olmalı.');
  }
  return jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
}
