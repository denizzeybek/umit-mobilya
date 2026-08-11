import type { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import type { Connection } from 'mongoose';

import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

/**
 * Boots the whole service exactly the way `main.ts` does, so a spec can never
 * exercise a differently-configured app than production runs.
 *
 * Every characterization spec goes through here. During the migration that is
 * what let the same assertions hit the legacy Express handler before a port
 * and the Nest controller after it; now that the port is finished they keep
 * guarding the contract those handlers agreed on.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  setupApp(app);
  await app.init();

  /*
   * Index builds are fired off asynchronously when a model is registered, so
   * without this a spec can insert a duplicate email before the unique index
   * exists and see 201 where 400 belongs — a failure that only shows up
   * sometimes, which is the worst kind.
   */
  await app.get<Connection>(getConnectionToken()).syncIndexes();

  return app;
}

export function signTestToken(userId = '507f1f77bcf86cd799439011'): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET yok — test/setup-env.ts çalışmamış olmalı.');
  }
  return jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
}
