/**
 * Runs before a spec file is imported — which matters, because
 * `ConfigModule.forRoot()` validates the environment while the `@Module`
 * decorator is being evaluated, i.e. at import time. Setting these inside a
 * `beforeAll` would already be too late.
 *
 * The values are deliberately fake. A spec must never be able to reach the
 * real Atlas cluster or the real R2 bucket.
 */
const memoryUri = process.env['MONGO_MEMORY_URI'];

if (!memoryUri) {
  throw new Error(
    'MONGO_MEMORY_URI yok — test/global-setup.ts çalışmamış olmalı.',
  );
}

const worker = process.env['JEST_WORKER_ID'] ?? '1';

process.env['MONGO_URI'] = `${memoryUri.replace(/\/$/, '')}/jest-${worker}`;
process.env['JWT_SECRET'] = 'characterization-secret';
process.env['BUCKET_NAME'] = 'test-bucket';
process.env['S3_ENDPOINT'] = 'https://account.r2.cloudflarestorage.com';
process.env['PUBLIC_BUCKET_URL'] = 'https://img.test';
process.env['ACCESS_KEY'] = 'test-access-key';
process.env['SECRET_ACCESS_KEY'] = 'test-secret-key';
process.env['ALLOWED_ORIGINS'] = 'http://localhost:3001';

export {};
