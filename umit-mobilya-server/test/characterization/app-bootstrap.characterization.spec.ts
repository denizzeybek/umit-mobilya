import type { INestApplication } from '@nestjs/common';
import mongoose from 'mongoose';
import request from 'supertest';

import { createTestApp } from '../create-test-app';
import { connectTestMongo, disconnectTestMongo } from '../mongo-memory';

/**
 * The migration rests on one claim: a NestJS app can serve the not-yet-ported
 * Express routers on the same port, so the handover happens domain by domain
 * instead of in one jump. This spec is that claim, checked.
 *
 * It also pins the ordering rule that makes the handover work — Express
 * middleware added with `app.use()` runs before Nest's router, so a domain is
 * released by deleting its line from `routes/index.js`, not by adding a Nest
 * controller and hoping.
 */
describe('Nest bootstrap with the legacy Express mount', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await connectTestMongo();

    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestMongo();
  });

  it('serves a legacy Express route through the Nest server', async () => {
    await mongoose.connection
      .collection('categories')
      .insertOne({ name: 'Koltuk', createdAt: new Date() });

    const response = await request(app.getHttpServer()).get('/api/categories');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('Koltuk');
  });

  it('publishes the OpenAPI schema the frontend client is generated from', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toMatch(/^3\./);
    expect(response.body.info.title).toBe('Ümit Mobilya API');
  });

  /*
   * This is the migration's progress bar. A path appears here the moment its
   * domain moves to Nest, and only then does `yarn gcl` generate a client for
   * it — the legacy Express routes are invisible to the schema, so anything
   * still listed as "not described" is still un-ported.
   */
  it('describes the ported domains and not the ones still served by Express', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json');
    const paths = Object.keys(response.body.paths ?? {});

    expect(paths).toContain('/api/categories');
    expect(paths).toContain('/api/auth/login');
    expect(paths).not.toContain('/api/products');
  });

  it('rejects an origin that is absent from ALLOWED_ORIGINS without echoing it back', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Origin', 'https://not-allowed.example');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
