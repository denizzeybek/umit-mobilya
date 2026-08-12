import type { INestApplication } from '@nestjs/common';
import mongoose from 'mongoose';
import request from 'supertest';

import { createTestApp } from '../create-test-app';
import { connectTestMongo, disconnectTestMongo } from '../mongo-memory';

/**
 * The service-wide contract: what boots, what is published, and who is let in.
 *
 * The path list below is not decoration. The frontend's `yarn gcl` generates
 * its API client from exactly this schema, so a path missing here is a method
 * missing there. Adding an endpoint means adding it to this list too — which
 * is the point: the list makes "did we remember to expose it?" a test failure
 * rather than a discovery made in the browser.
 */
describe('Service bootstrap', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await connectTestMongo();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestMongo();
  });

  it('answers a request end to end', async () => {
    await mongoose.connection
      .collection('categories')
      .insertOne({ name: 'Koltuk', createdAt: new Date() });

    const response = await request(app.getHttpServer()).get('/api/categories');

    expect(response.status).toBe(200);
    expect(response.body[0].name).toBe('Koltuk');
  });

  it('publishes the OpenAPI schema the frontend client is generated from', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toMatch(/^3\./);
    expect(response.body.info.title).toBe('Ümit Mobilya API');
  });

  it('describes every endpoint, so the generated client covers the whole API', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json');

    expect(Object.keys(response.body.paths ?? {}).sort()).toEqual([
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/me',
      '/api/auth/signup',
      '/api/categories',
      '/api/categories/filter',
      '/api/categories/{id}',
      '/api/pricebook',
      '/api/pricebook/texture',
      '/api/pricebook/versions',
      '/api/pricebook/versions/{version}',
      '/api/products',
      '/api/products/create-images/{id}',
      '/api/products/delete-image/{id}',
      '/api/products/filter',
      '/api/products/{id}',
      '/api/quotes',
      '/api/quotes/{code}',
      '/api/quotes/{code}/document',
    ]);
  });

  it('rejects an origin that is absent from ALLOWED_ORIGINS without echoing it back', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Origin', 'https://not-allowed.example');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows the configured origin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Origin', 'http://localhost:3001');

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3001',
    );
  });

  it('rejects a request carrying a field no DTO declares', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/products/filter')
      .send({ name: 'Koltuk', isAdmin: true });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('isAdmin');
  });
});
