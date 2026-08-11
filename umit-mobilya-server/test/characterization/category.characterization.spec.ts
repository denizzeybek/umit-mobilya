import type { INestApplication } from '@nestjs/common';
import mongoose from 'mongoose';
import request from 'supertest';

import { createTestApp, signTestToken } from '../create-test-app';
import {
  clearCollections,
  connectTestMongo,
  disconnectTestMongo,
} from '../mongo-memory';

/**
 * Pins the wire contract of `/api/categories` as the Express implementation
 * serves it today. Green on the first run is expected — this describes code
 * that already works. It becomes evidence only after the NestJS port, when it
 * has to stay green without a single assertion changing.
 *
 * See .claude/rules/00-tdd-discipline.md, Cycle A.
 */
describe('GET/POST/PUT/DELETE /api/categories (characterization)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    await connectTestMongo();
    app = await createTestApp();
    token = signTestToken();
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestMongo();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  const seedCategory = async (name: string): Promise<string> => {
    const created = await mongoose.connection
      .collection('categories')
      .insertOne({ name, createdAt: new Date() });
    return created.insertedId.toString();
  };

  describe('GET /api/categories', () => {
    it('responds 200 with every category, and is reachable without a token', async () => {
      await seedCategory('Koltuk');
      await seedCategory('Yatak');

      const response = await request(app.getHttpServer()).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((c: { name: string }) => c.name).sort()).toEqual([
        'Koltuk',
        'Yatak',
      ]);
    });

    it('responds 200 with an empty array when nothing is stored', async () => {
      const response = await request(app.getHttpServer()).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('exposes _id, name and createdAt on each category', async () => {
      await seedCategory('Koltuk');

      const response = await request(app.getHttpServer()).get('/api/categories');

      expect(response.body[0]).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          name: 'Koltuk',
          createdAt: expect.any(String),
        }),
      );
    });
  });

  describe('GET /api/categories/filter', () => {
    it('matches the name case-insensitively as a substring, reading it from the request BODY of a GET', async () => {
      await seedCategory('Koltuk Takımı');
      await seedCategory('Yatak Odası');

      const response = await request(app.getHttpServer())
        .get('/api/categories/filter')
        .send({ name: 'koltuk' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Koltuk Takımı');
    });

    it('returns everything when no name is supplied', async () => {
      await seedCategory('Koltuk');
      await seedCategory('Yatak');

      const response = await request(app.getHttpServer()).get('/api/categories/filter').send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('POST /api/categories', () => {
    it('responds 201 with the created category', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Koltuk' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          name: 'Koltuk',
        }),
      );
    });

    it('responds 400 when name is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name');
      expect(response.body.errors).toEqual(
        expect.arrayContaining(['name should not be empty']),
      );
    });

    it('responds 401 without a token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: 'Koltuk' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Unauthorized - No token provided' }),
      );
    });

    it('responds 401 when the token is not a Bearer token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', token)
        .send({ name: 'Koltuk' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Unauthorized - No token provided' }),
      );
    });

    it('responds 401 when the token is signed with the wrong secret', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', 'Bearer not-a-real-token')
        .send({ name: 'Koltuk' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Unauthorized - Invalid token' }),
      );
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('responds 200 with the updated document', async () => {
      const id = await seedCategory('Koltuk');

      const response = await request(app.getHttpServer())
        .put(`/api/categories/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Koltuk Takımı' });

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(id);
      expect(response.body.name).toBe('Koltuk Takımı');
    });

    it('persists the rename', async () => {
      const id = await seedCategory('Koltuk');

      await request(app.getHttpServer())
        .put(`/api/categories/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Koltuk Takımı' });

      const stored = await request(app.getHttpServer()).get('/api/categories');
      expect(stored.body[0].name).toBe('Koltuk Takımı');
    });

    it('leaves products pointing at the renamed category, because the link is an id', async () => {
      const id = await seedCategory('Koltuk');
      await mongoose.connection
        .collection('products')
        .insertOne({ name: 'Üçlü Koltuk', category: new mongoose.Types.ObjectId(id) });

      await request(app.getHttpServer())
        .put(`/api/categories/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Koltuk Takımı' });

      const product = await mongoose.connection
        .collection('products')
        .findOne({ name: 'Üçlü Koltuk' });

      expect(product?.['category']?.toString()).toBe(id);
    });

    it('responds 404 when the id matches nothing', async () => {
      const unknownId = new mongoose.Types.ObjectId().toString();

      const response = await request(app.getHttpServer())
        .put(`/api/categories/${unknownId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Koltuk' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Category not found.' }),
      );
    });

    it('responds 400 when the id is not a valid ObjectId', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/categories/not-an-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Koltuk' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Geçersiz id: not-an-id');
    });

    it('responds 401 without a token', async () => {
      const id = await seedCategory('Koltuk');

      const response = await request(app.getHttpServer())
        .put(`/api/categories/${id}`)
        .send({ name: 'Koltuk Takımı' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('responds 200 with a message, not with the deleted document', async () => {
      const id = await seedCategory('Koltuk');

      const response = await request(app.getHttpServer())
        .delete(`/api/categories/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Kategori başarıyla silindi.' });
    });

    it('actually removes the document', async () => {
      const id = await seedCategory('Koltuk');

      await request(app.getHttpServer())
        .delete(`/api/categories/${id}`)
        .set('Authorization', `Bearer ${token}`);

      const remaining = await request(app.getHttpServer()).get('/api/categories');
      expect(remaining.body).toEqual([]);
    });

    it('responds 404 when the id matches nothing', async () => {
      const unknownId = new mongoose.Types.ObjectId().toString();

      const response = await request(app.getHttpServer())
        .delete(`/api/categories/${unknownId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Kategori bulunamadı.' }),
      );
    });

    it('responds 401 without a token', async () => {
      const id = await seedCategory('Koltuk');

      const response = await request(app.getHttpServer()).delete(`/api/categories/${id}`);

      expect(response.status).toBe(401);
    });
  });
});
