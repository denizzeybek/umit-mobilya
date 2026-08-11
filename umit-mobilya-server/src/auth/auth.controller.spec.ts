import { Test } from '@nestjs/testing';
import type { Response } from 'express';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TOKEN_MAX_AGE_SECONDS } from './auth.service';

describe('AuthController', () => {
  const service = {
    signup: jest.fn(),
    login: jest.fn(),
    findById: jest.fn(),
  };

  let controller: AuthController;
  let response: Response;
  let cookie: jest.Mock;

  beforeEach(async () => {
    jest.resetAllMocks();
    cookie = jest.fn();
    response = { cookie } as unknown as Response;

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(AuthController);
  });

  const authResult = { user: 'user-1', token: 'signed-token' };

  describe('signup', () => {
    it('returns the service result unchanged', async () => {
      service.signup.mockResolvedValue(authResult);

      await expect(
        controller.signup({ email: 'a@b.com', password: 'secret123' }, response),
      ).resolves.toEqual(authResult);
    });

    /*
     * The token goes back twice on purpose: in the body, which the frontend
     * puts in localStorage, and as an httpOnly cookie, which `checkUser` on the
     * legacy side reads. Dropping either one breaks one of the two consumers.
     */
    it('also sets the token as an httpOnly cookie', async () => {
      service.signup.mockResolvedValue(authResult);

      await controller.signup(
        { email: 'a@b.com', password: 'secret123' },
        response,
      );

      expect(cookie).toHaveBeenCalledWith('jwt', 'signed-token', {
        httpOnly: true,
        maxAge: TOKEN_MAX_AGE_SECONDS * 1000,
      });
    });

    it('expresses the cookie lifetime in milliseconds, not seconds', async () => {
      service.signup.mockResolvedValue(authResult);

      await controller.signup(
        { email: 'a@b.com', password: 'secret123' },
        response,
      );

      expect(cookie.mock.calls[0]?.[2]).toEqual({
        httpOnly: true,
        maxAge: 259_200_000,
      });
    });
  });

  describe('login', () => {
    it('returns the service result and sets the same cookie', async () => {
      service.login.mockResolvedValue(authResult);

      await expect(
        controller.login({ email: 'a@b.com', password: 'secret123' }, response),
      ).resolves.toEqual(authResult);
      expect(cookie).toHaveBeenCalledWith('jwt', 'signed-token', {
        httpOnly: true,
        maxAge: TOKEN_MAX_AGE_SECONDS * 1000,
      });
    });
  });

  describe('logout', () => {
    it('expires the cookie and answers with a message', () => {
      expect(controller.logout(response)).toEqual({
        message: 'Çıkış yapıldı.',
      });
      expect(cookie).toHaveBeenCalledWith('jwt', '', { maxAge: 1 });
    });
  });

  describe('me', () => {
    it('wraps the user in the shape the frontend store reads', async () => {
      const user = { _id: 'user-1', email: 'a@b.com' };
      service.findById.mockResolvedValue(user);

      await expect(controller.me({ id: 'user-1' })).resolves.toEqual({
        message: 'Token is valid',
        user,
      });
    });

    it('looks the user up by the id carried in the token', async () => {
      service.findById.mockResolvedValue({ _id: 'user-1', email: 'a@b.com' });

      await controller.me({ id: 'user-1' });

      expect(service.findById).toHaveBeenCalledWith('user-1');
    });
  });
});
