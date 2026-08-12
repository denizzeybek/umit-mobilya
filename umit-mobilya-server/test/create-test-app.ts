import type { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import type { Connection } from 'mongoose';

import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

export interface ICreateTestAppOptions {
  /**
   * Hız sınırı gerçekten uygulansın mı. **Varsayılan `false`.**
   *
   * Bir spec dosyası aynı IP'den onlarca istek atıyor ve `POST /api/quotes`
   * dakikada beşle sınırlı — fiyat ağının beş kanonik tasarımı tam sınırda
   * duruyor, altıncı case eklendiği gün sessizce 429 alırdı. Testin konusu
   * hız sınırı değilse sınır kapalı olmalı.
   *
   * Sınırın KENDİSİ `throttle.characterization.spec.ts` içinde, bu bayrak
   * açıkken doğrulanıyor.
   */
  enforceRateLimit?: boolean;
}

/**
 * Boots the whole service exactly the way `main.ts` does, so a spec can never
 * exercise a differently-configured app than production runs.
 *
 * Every characterization spec goes through here. During the migration that is
 * what let the same assertions hit the legacy Express handler before a port
 * and the Nest controller after it; now that the port is finished they keep
 * guarding the contract those handlers agreed on.
 */
export async function createTestApp(
  options: ICreateTestAppOptions = {},
): Promise<INestApplication> {
  /*
   * Uygulama kurulmadan ÖNCE yazılıyor: `ThrottlerModule.forRootAsync`
   * bayrağı boot anında `ConfigService`ten okuyor.
   *
   * Yalnızca hız sınırı kapanıyor, yetkilendirme değil — `JwtAuthGuard` route
   * başına `@UseGuards` ile bağlı ve bundan etkilenmiyor.
   */
  process.env['THROTTLE_SKIP'] = options.enforceRateLimit ? '0' : '1';

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
