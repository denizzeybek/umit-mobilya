import { NestFactory } from '@nestjs/core';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildOpenApiDocument } from '../openapi';

/**
 * Writes `openapi.json` — the file the frontend's `yarn gcl` generates its API
 * client from.
 *
 * It boots the real app against a throwaway in-memory mongod rather than
 * scraping `/docs-json` off a running server, so the schema can be regenerated
 * with no database, no credentials and no server to start first. The document
 * comes from the same builder production serves, so the two cannot drift.
 *
 * It lives under `src/` rather than a top-level `tools/` for a reason: the
 * `@nestjs/swagger` CLI plugin is a TypeScript transformer that only runs
 * during `nest build`. Run through ts-node instead, every schema comes out as
 * an empty object — the endpoints appear, the shapes do not — so this must be
 * compiled and executed from `dist/`.
 */
async function dump(): Promise<void> {
  const mongo = await MongoMemoryServer.create();

  process.env['NODE_ENV'] = 'test';
  process.env['MONGO_URI'] = mongo.getUri();
  process.env['JWT_SECRET'] ??= 'schema-dump';
  process.env['BUCKET_NAME'] ??= 'schema-dump';
  process.env['S3_ENDPOINT'] ??= 'https://account.r2.cloudflarestorage.com';
  process.env['PUBLIC_BUCKET_URL'] ??= 'https://img.example';
  process.env['ACCESS_KEY'] ??= 'schema-dump';
  process.env['SECRET_ACCESS_KEY'] ??= 'schema-dump';

  /*
   * Imported here rather than at the top of the file: `ConfigModule.forRoot()`
   * validates the environment while the `@Module` decorator is evaluated, so a
   * static import would run that check before the lines above have set
   * anything, and the dump would fail on missing variables.
   */
  const { AppModule } = await import('../app.module');

  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();

  const target = join(process.cwd(), 'openapi.json');
  writeFileSync(
    target,
    `${JSON.stringify(buildOpenApiDocument(app), null, 2)}\n`,
  );

  await app.close();
  await mongo.stop();

  process.stdout.write(`openapi.json yazıldı: ${target}\n`);
}

void dump();
