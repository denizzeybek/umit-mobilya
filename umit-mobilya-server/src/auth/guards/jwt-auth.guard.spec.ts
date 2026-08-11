import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

import { JwtAuthGuard } from './jwt-auth.guard';

/*
 * The 401 wording is asserted verbatim on purpose. The frontend surfaces
 * `error.response.data.message` straight into a toast, so these two strings
 * are user-visible text, not internal detail.
 */
describe('JwtAuthGuard', () => {
  const secret = 'test-secret';
  const guard = new JwtAuthGuard({
    getOrThrow: () => secret,
  } as unknown as ConfigService);

  const contextWith = (headers: Record<string, string>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    }) as ExecutionContext;

  it('lets a valid Bearer token through', () => {
    const token = jwt.sign({ id: 'user-1' }, secret);

    expect(guard.canActivate(contextWith({ authorization: `Bearer ${token}` }))).toBe(
      true,
    );
  });

  it('rejects a missing Authorization header with "No token provided"', () => {
    expect(() => guard.canActivate(contextWith({}))).toThrow(
      new UnauthorizedException('Unauthorized - No token provided'),
    );
  });

  it('rejects a header that is not a Bearer token with "No token provided"', () => {
    const token = jwt.sign({ id: 'user-1' }, secret);

    expect(() => guard.canActivate(contextWith({ authorization: token }))).toThrow(
      new UnauthorizedException('Unauthorized - No token provided'),
    );
  });

  it('rejects a token signed with another secret with "Invalid token"', () => {
    const token = jwt.sign({ id: 'user-1' }, 'a-different-secret');

    expect(() =>
      guard.canActivate(contextWith({ authorization: `Bearer ${token}` })),
    ).toThrow(new UnauthorizedException('Unauthorized - Invalid token'));
  });

  it('rejects an expired token with "Invalid token"', () => {
    const token = jwt.sign({ id: 'user-1' }, secret, { expiresIn: -10 });

    expect(() =>
      guard.canActivate(contextWith({ authorization: `Bearer ${token}` })),
    ).toThrow(new UnauthorizedException('Unauthorized - Invalid token'));
  });

  it('attaches the decoded payload to the request so a handler can read it', () => {
    const token = jwt.sign({ id: 'user-1' }, secret);
    const request: { headers: Record<string, string>; user?: unknown } = {
      headers: { authorization: `Bearer ${token}` },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;

    guard.canActivate(context);

    expect(request.user).toEqual(expect.objectContaining({ id: 'user-1' }));
  });
});
