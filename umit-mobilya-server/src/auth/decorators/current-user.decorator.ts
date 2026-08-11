import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { JwtPayload } from '../guards/jwt-auth.guard';

/** The decoded JWT payload that {@link JwtAuthGuard} attached to the request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();

    return request.user as JwtPayload;
  },
);
