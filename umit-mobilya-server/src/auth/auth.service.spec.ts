import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import type { Model } from 'mongoose';

import {
  clearCollections,
  connectTestMongo,
  disconnectTestMongo,
} from '../../test/mongo-memory';
import { AuthService } from './auth.service';
import type { User } from './schemas/user.schema';
import { UserSchema } from './schemas/user.schema';

describe('AuthService', () => {
  const secret = 'characterization-secret';
  const credentials = { email: 'deniz@example.com', password: 'secret123' };

  let service: AuthService;
  let model: Model<User>;

  beforeAll(async () => {
    await connectTestMongo();
    model = mongoose.connection.model('User', UserSchema);
    await model.syncIndexes();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('User'), useValue: model },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => secret },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  afterAll(async () => {
    await disconnectTestMongo();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  describe('signup', () => {
    it('returns the new user id and a token', async () => {
      const result = await service.signup(credentials);

      expect(mongoose.Types.ObjectId.isValid(result.user)).toBe(true);
      expect(typeof result.token).toBe('string');
    });

    it('stores the password as a bcrypt hash, never in the clear', async () => {
      await service.signup(credentials);

      const stored = await model.findOne({ email: credentials.email }).exec();

      expect(stored?.password).not.toBe(credentials.password);
      expect(stored?.password).toMatch(/^\$2[aby]\$/);
    });

    it('lowercases the email', async () => {
      await service.signup({ ...credentials, email: 'Deniz@Example.COM' });

      expect(await model.findOne({ email: 'deniz@example.com' })).not.toBeNull();
    });

    it('rejects a second signup with the same email', async () => {
      await service.signup(credentials);

      await expect(service.signup(credentials)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('says which field collided when the email is taken', async () => {
      await service.signup(credentials);

      await expect(service.signup(credentials)).rejects.toThrow(
        'that email is already registered',
      );
    });
  });

  describe('token', () => {
    it('signs the user id into the payload', async () => {
      const result = await service.signup(credentials);

      const payload = jwt.verify(result.token, secret) as { id: string };

      expect(payload.id).toBe(result.user);
    });

    it('expires in exactly three days', async () => {
      const result = await service.signup(credentials);

      const payload = jwt.verify(result.token, secret) as {
        iat: number;
        exp: number;
      };

      expect(payload.exp - payload.iat).toBe(3 * 24 * 60 * 60);
    });
  });

  describe('login', () => {
    it('returns the user id and a token for correct credentials', async () => {
      const created = await service.signup(credentials);

      const result = await service.login(credentials);

      expect(result.user).toBe(created.user);
    });

    it('rejects a wrong password with the message the frontend shows', async () => {
      await service.signup(credentials);

      await expect(
        service.login({ ...credentials, password: 'wrong-password' }),
      ).rejects.toThrow('That password is incorrect');
    });

    it('rejects an unregistered email', async () => {
      await expect(service.login(credentials)).rejects.toThrow(
        'That email is not registered',
      );
    });

    it('rejects with 400, not 401, matching what the Express version returned', async () => {
      await expect(service.login(credentials)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findById', () => {
    it('returns the user without the password hash', async () => {
      const created = await service.signup(credentials);

      const user = await service.findById(created.user);

      expect(user.email).toBe(credentials.email);
      expect(user).not.toHaveProperty('password');
    });

    it('throws NotFoundException when the id matches nobody', async () => {
      const unknownId = new mongoose.Types.ObjectId().toString();

      await expect(service.findById(unknownId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
