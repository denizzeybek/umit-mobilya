import type { INestApplication } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import { createTestApp, signTestToken } from '../create-test-app';
import {
  clearCollections,
  connectTestMongo,
  disconnectTestMongo,
} from '../mongo-memory';

/**
 * Pins `/api/auth` as the Express implementation serves it today, before the
 * NestJS port. See .claude/rules/00-tdd-discipline.md, Cycle A.
 *
 * The frontend only ever calls two of these — `POST /login` and `GET /me` —
 * but the rest are pinned too, because "nothing calls it" is a claim that has
 * to be re-checked, not assumed.
 */
describe('/api/auth (characterization)', () => {
  let app: INestApplication;

  const credentials = { email: 'deniz@example.com', password: 'secret123' };

  beforeAll(async () => {
    await connectTestMongo();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestMongo();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  const signup = async (
    body: Record<string, unknown> = credentials,
  ): Promise<request.Response> =>
    request(app.getHttpServer()).post('/api/auth/signup').send(body);

  describe('POST /api/auth/signup', () => {
    it('responds 201 with the new user id and a token', async () => {
      const response = await signup();

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        user: expect.any(String),
        token: expect.any(String),
      });
    });

    it('returns the user id as a bare string, not an object', async () => {
      const response = await signup();

      expect(mongoose.Types.ObjectId.isValid(response.body.user)).toBe(true);
    });

    it('also sets the token as an httpOnly cookie', async () => {
      const response = await signup();

      const cookie = response.headers['set-cookie']?.[0] ?? '';
      expect(cookie).toMatch(/^jwt=/);
      expect(cookie).toContain('HttpOnly');
    });

    it('signs a token that carries the user id and expires in three days', async () => {
      const response = await signup();

      const payload = jwt.verify(
        response.body.token,
        process.env['JWT_SECRET'] as string,
      ) as { id: string; iat: number; exp: number };

      expect(payload.id).toBe(response.body.user);
      expect(payload.exp - payload.iat).toBe(3 * 24 * 60 * 60);
    });

    it('stores the password hashed, never in the clear', async () => {
      await signup();

      const user = await mongoose.connection
        .collection('users')
        .findOne({ email: credentials.email });

      expect(user?.['password']).not.toBe(credentials.password);
      expect(user?.['password']).toMatch(/^\$2[aby]\$/);
    });

    it('lowercases the email', async () => {
      await signup({ ...credentials, email: 'Deniz@Example.COM' });

      const user = await mongoose.connection
        .collection('users')
        .findOne({ email: 'deniz@example.com' });

      expect(user).not.toBeNull();
    });

    it('responds 400 when the email is already registered', async () => {
      await signup();

      const response = await signup();

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('that email is already registered');
    });

    /*
     * The Express version answered these two with `{ errors: { email: '',
     * password: '' } }` — a rejection with no reason attached, because
     * handleErrors looked for "user validation failed" while mongoose writes
     * "User validation failed" with a capital U, so the branch never ran.
     *
     * Status is unchanged at 400. The reason is now actually present, which is
     * the whole point of moving validation onto DTOs.
     */
    it('responds 400 and says the email is malformed', async () => {
      const response = await signup({ ...credentials, email: 'not-an-email' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Please enter a valid email');
    });

    it('responds 400 and says the password is too short', async () => {
      const response = await signup({ ...credentials, password: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'Minimum password length is 6 characters',
      );
    });

    it('does store the user when validation passes, so the 400 is not a false negative', async () => {
      await signup();

      expect(
        await mongoose.connection.collection('users').countDocuments(),
      ).toBe(1);
    });
  });

  describe('POST /api/auth/login', () => {
    it('responds 200 with the user id and a token', async () => {
      await signup();

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: expect.any(String),
        token: expect.any(String),
      });
    });

    it('also sets the httpOnly cookie', async () => {
      await signup();

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(credentials);

      expect(response.headers['set-cookie']?.[0] ?? '').toContain('HttpOnly');
    });

    it('responds 400 when the password is wrong', async () => {
      await signup();

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ ...credentials, password: 'wrong-password' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('That password is incorrect');
    });

    it('responds 400 when the email is not registered', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('That email is not registered');
    });
  });

  describe('GET /api/auth/me', () => {
    const meWith = async (token: string): Promise<request.Response> =>
      request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

    it('responds 200 with the user and never with the password hash', async () => {
      const created = await signup();

      const response = await meWith(created.body.token);

      expect(response.status).toBe(200);
      expect(response.body.user._id).toBe(created.body.user);
      expect(response.body.user.email).toBe(credentials.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('responds 401 without a token', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('responds 401 when the token is signed with another secret', async () => {
      const response = await meWith(
        jwt.sign({ id: 'x' }, 'a-different-secret'),
      );

      expect(response.status).toBe(401);
    });

    it('responds 404 when the token is valid but the user is gone', async () => {
      const response = await meWith(signTestToken());

      expect(response.status).toBe(404);
    });
  });
});
