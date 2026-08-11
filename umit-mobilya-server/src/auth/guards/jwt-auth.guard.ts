import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: string;
}

/**
 * Replaces `middleware/auth.middleware.js`'s `requireAuth` for ported domains.
 *
 * The two messages are reproduced word for word: the frontend puts
 * `error.response.data.message` straight into a toast, so changing them changes
 * what a user reads.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Unauthorized - No token provided');
    }

    const token = header.slice('Bearer '.length);

    try {
      const payload = jwt.verify(
        token,
        this.config.getOrThrow<string>('JWT_SECRET'),
      );
      (request as Request & { user?: unknown }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Unauthorized - Invalid token');
    }
  }
}
