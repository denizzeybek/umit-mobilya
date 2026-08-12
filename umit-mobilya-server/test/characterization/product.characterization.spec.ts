import type { INestApplication } from '@nestjs/common';
import mongoose from 'mongoose';
import sharp from 'sharp';
import request from 'supertest';

import { createTestApp, signTestToken } from '../create-test-app';
import {
  clearCollections,
  connectTestMongo,
  disconnectTestMongo,
} from '../mongo-memory';

/*
 * A spec that reaches R2 is not a unit test, it is a bill. Every command the
 * controller sends is captured here instead, which also lets the spec assert
 * *which* objects got deleted — the thing most likely to go wrong silently.
 */
const sentCommands: { type: string; input: Record<string, unknown> }[] = [];

jest.mock('@aws-sdk/client-s3', () => {
  class FakeCommand {
    constructor(public readonly input: Record<string, unknown>) {}
  }
  return {
    S3Client: class {
      send(command: { constructor: { name: string }; input: Record<string, unknown> }) {
        sentCommands.push({
          type: command.constructor.name,
          input: command.input,
        });
        return Promise.resolve({});
      }
    },
    PutObjectCommand: class extends FakeCommand {},
    DeleteObjectCommand: class extends FakeCommand {},
  };
});

/**
 * Pins `/api/products` as the Express implementation serves it today.
 * See .claude/rules/00-tdd-discipline.md, Cycle A.
 */
describe('/api/products (characterization)', () => {
  let app: INestApplication;
  let token: string;
  let jpeg: Buffer;
  let categoryId: string;

  beforeAll(async () => {
    await connectTestMongo();
    app = await createTestApp();
    token = signTestToken();
    jpeg = await sharp({
      create: {
        width: 20,
        height: 20,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .jpeg()
      .toBuffer();
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestMongo();
  });

  beforeEach(async () => {
    await clearCollections();
    sentCommands.length = 0;

    const category = await mongoose.connection
      .collection('categories')
      .insertOne({ name: 'Koltuk', createdAt: new Date() });
    categoryId = category.insertedId.toString();
  });

  const seedProduct = async (
    overrides: Record<string, unknown> = {},
  ): Promise<string> => {
    const inserted = await mongoose.connection.collection('products').insertOne({
      name: 'Üçlü Koltuk',
      currency: 'TRY',
      imageName: 'uclu-koltuk-abc',
      imageNameList: [],
      category: new mongoose.Types.ObjectId(categoryId),
      quantity: 1,
      modules: [],
      createdAt: new Date(),
      ...overrides,
    });
    return inserted.insertedId.toString();
  };

  const auth = (req: request.Test): request.Test =>
    req.set('Authorization', `Bearer ${token}`);

  describe('GET /api/products', () => {
    it('responds 201 — not 200 — to a plain GET', async () => {
      const response = await request(app.getHttpServer()).get('/api/products');

      expect(response.status).toBe(201);
    });

    it('is public', async () => {
      await seedProduct();

      const response = await request(app.getHttpServer()).get('/api/products');

      expect(response.body).toHaveLength(1);
    });

    it('composes imageUrl from the stored key and the public bucket URL', async () => {
      await seedProduct();

      const response = await request(app.getHttpServer()).get('/api/products');

      expect(response.body[0].imageUrl).toBe(
        'https://img.test/uclu-koltuk-abc',
      );
    });

    it('returns imageUrl as null when the product has no image key', async () => {
      await seedProduct({ imageName: undefined });

      const response = await request(app.getHttpServer()).get('/api/products');

      expect(response.body[0].imageUrl).toBeNull();
    });

    it('url-encodes a key that contains characters unsafe in a URL', async () => {
      await seedProduct({ imageName: 'a b+c' });

      const response = await request(app.getHttpServer()).get('/api/products');

      expect(response.body[0].imageUrl).toBe('https://img.test/a%20b%2Bc');
    });

    it('keeps both the keys and the composed urls in the response', async () => {
      await seedProduct({ imageNameList: ['one', 'two'] });

      const response = await request(app.getHttpServer()).get('/api/products');

      expect(response.body[0].imageNameList).toEqual(['one', 'two']);
      expect(response.body[0].imageUrlList).toEqual([
        'https://img.test/one',
        'https://img.test/two',
      ]);
    });

    it('populates the category rather than returning a bare id', async () => {
      await seedProduct();

      const response = await request(app.getHttpServer()).get('/api/products');

      expect(response.body[0].category.name).toBe('Koltuk');
    });

  });

  describe('GET /api/products/:id', () => {
    it('responds 201 with a single product', async () => {
      const id = await seedProduct();

      const response = await request(app.getHttpServer()).get(
        `/api/products/${id}`,
      );

      expect(response.status).toBe(201);
      expect(response.body._id).toBe(id);
    });

    it('responds 404 when the id matches nothing', async () => {
      const unknownId = new mongoose.Types.ObjectId().toString();

      const response = await request(app.getHttpServer()).get(
        `/api/products/${unknownId}`,
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Ürün bulunamadı');
    });
  });

  describe('POST /api/products/filter', () => {
    it('is public even though it uses a mutation verb, because it runs a read', async () => {
      await seedProduct();

      const response = await request(app.getHttpServer())
        .post('/api/products/filter')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('matches the name case-insensitively as a substring', async () => {
      await seedProduct({ name: 'Üçlü Koltuk' });
      await seedProduct({ name: 'Yatak' });

      const response = await request(app.getHttpServer())
        .post('/api/products/filter')
        .send({ name: 'koltuk' });

      expect(response.body).toHaveLength(1);
    });

    it('filters by category id', async () => {
      await seedProduct();
      const other = await mongoose.connection
        .collection('categories')
        .insertOne({ name: 'Yatak', createdAt: new Date() });

      const response = await request(app.getHttpServer())
        .post('/api/products/filter')
        .send({ category: other.insertedId.toString() });

      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/products', () => {
    const create = (): request.Test =>
      auth(request(app.getHttpServer()).post('/api/products'))
        .field('name', 'Üçlü Koltuk')
        .field('category', categoryId)
        .attach('image', jpeg, 'Üçlü Koltuk.jpg');

    it('responds 201 with the stored document, not the flattened read shape', async () => {
      const response = await create();

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Üçlü Koltuk');
      expect(response.body).not.toHaveProperty('totalPrice');
      expect(response.body).not.toHaveProperty('imageUrl');
    });

    it('uploads the resized image to the bucket', async () => {
      await create();

      const put = sentCommands.filter((c) => c.type === 'PutObjectCommand');
      expect(put).toHaveLength(1);
      expect(put[0]?.input['Bucket']).toBe('test-bucket');
    });

    it('slugifies the original filename into the key and appends 32 random bytes', async () => {
      const response = await auth(
        request(app.getHttpServer()).post('/api/products'),
      )
        .field('name', 'Üçlü Koltuk')
        .field('category', categoryId)
        .attach('image', jpeg, 'Living Room Sofa.JPG');

      expect(response.body.imageName).toMatch(
        /^living-room-sofa-[0-9a-f]{64}$/,
      );
    });

    /*
     * The key ends up inside a public URL, so it must be URL-safe — and it is.
     * It is not, however, readable: NFKD decomposes the Turkish letters and
     * every combining mark then collapses to a dash, so "Üçlü Koltuk.jpg"
     * becomes something like "a-a-la-1-4-koltuk-<hex>". Ugly but harmless, and
     * the random suffix is what actually guarantees uniqueness.
     */
    it('produces a URL-safe key even from a Turkish filename', async () => {
      const response = await create();

      expect(response.body.imageName).toMatch(/^[a-z0-9.-]+$/);
      expect(response.body.imageName).toMatch(/-[0-9a-f]{64}$/);
    });

    it('responds 401 without a token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/products')
        .field('name', 'X')
        .attach('image', jpeg, 'x.jpg');

      expect(response.status).toBe(401);
    });

    it('responds 404 when the category does not exist', async () => {
      const unknownCategory = new mongoose.Types.ObjectId().toString();

      const response = await auth(
        request(app.getHttpServer()).post('/api/products'),
      )
        .field('name', 'Üçlü Koltuk')
        .field('category', unknownCategory)
        .attach('image', jpeg, 'x.jpg');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Category not found');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('responds 200 with the updated document', async () => {
      const id = await seedProduct();

      const response = await auth(
        request(app.getHttpServer()).put(`/api/products/${id}`),
      ).send({ name: 'Dörtlü Koltuk' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Dörtlü Koltuk');
    });

    it('leaves fields that were not sent untouched', async () => {
      const id = await seedProduct({ price: 1000, sizes: '200x90' });

      const response = await auth(
        request(app.getHttpServer()).put(`/api/products/${id}`),
      ).send({ name: 'Dörtlü Koltuk' });
      expect(response.body.sizes).toBe('200x90');
    });

    it('responds 404 when the id matches nothing', async () => {
      const unknownId = new mongoose.Types.ObjectId().toString();

      const response = await auth(
        request(app.getHttpServer()).put(`/api/products/${unknownId}`),
      ).send({ name: 'X' });

      expect(response.status).toBe(404);
    });

    it('responds 401 without a token', async () => {
      const id = await seedProduct();

      const response = await request(app.getHttpServer())
        .put(`/api/products/${id}`)
        .send({ name: 'X' });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/products/create-images/:id', () => {
    it('appends every uploaded key under the SINGULAR field name "image"', async () => {
      const id = await seedProduct({ imageNameList: ['already-here'] });

      const response = await auth(
        request(app.getHttpServer()).put(`/api/products/create-images/${id}`),
      )
        .attach('image', jpeg, 'one.jpg')
        .attach('image', jpeg, 'two.jpg');

      expect(response.status).toBe(200);
      expect(response.body.imageNameList).toHaveLength(3);
      expect(response.body.imageNameList[0]).toBe('already-here');
    });

    it('responds 400 when no file is attached', async () => {
      const id = await seedProduct();

      const response = await auth(
        request(app.getHttpServer()).put(`/api/products/create-images/${id}`),
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No files uploaded');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('responds 200 and removes the document', async () => {
      const id = await seedProduct();

      const response = await auth(
        request(app.getHttpServer()).delete(`/api/products/${id}`),
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Ürün silindi');
      expect(
        await mongoose.connection.collection('products').countDocuments(),
      ).toBe(0);
    });

    it('deletes the main image and every gallery image from the bucket', async () => {
      const id = await seedProduct({
        imageName: 'main-key',
        imageNameList: ['gallery-1', 'gallery-2'],
      });

      await auth(request(app.getHttpServer()).delete(`/api/products/${id}`));

      const deleted = sentCommands
        .filter((c) => c.type === 'DeleteObjectCommand')
        .map((c) => c.input['Key']);
      expect(deleted.sort()).toEqual(['gallery-1', 'gallery-2', 'main-key']);
    });

    it('responds 404 when the id matches nothing', async () => {
      const unknownId = new mongoose.Types.ObjectId().toString();

      const response = await auth(
        request(app.getHttpServer()).delete(`/api/products/${unknownId}`),
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/products/delete-image/:id', () => {
    it('responds 200 and drops the key from the gallery list', async () => {
      const id = await seedProduct({ imageNameList: ['keep', 'drop'] });

      const response = await auth(
        request(app.getHttpServer()).post(`/api/products/delete-image/${id}`),
      ).send({ imageName: 'drop' });

      expect(response.status).toBe(200);

      const stored = await mongoose.connection
        .collection('products')
        .findOne({ _id: new mongoose.Types.ObjectId(id) });
      expect(stored?.['imageNameList']).toEqual(['keep']);
    });

    it('responds 400 when no image name is given', async () => {
      const id = await seedProduct();

      const response = await auth(
        request(app.getHttpServer()).post(`/api/products/delete-image/${id}`),
      ).send({});

      expect(response.status).toBe(400);
    });
  });
});
