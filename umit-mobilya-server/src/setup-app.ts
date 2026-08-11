import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import express from 'express';

import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { buildOpenApiDocument } from './openapi';

/**
 * Shared between `main.ts` and the e2e specs, so a test never exercises a
 * differently-configured app than production runs.
 */
export function setupApp(app: INestApplication): void {
  /*
   * Body parsing has to be registered here, not left to Nest.
   *
   * Nest installs its own parser during `app.init()`, which happens after
   * `mountLegacyExpress()` has already added the Express routers with
   * `app.use()`. Middleware runs in registration order, so without this the
   * legacy handlers see `req.body === undefined` and crash on the first
   * destructure.
   */
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const allowedOrigins = (
    process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:3001'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    credentials: true,
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      callback(null, !origin || allowedOrigins.includes(origin));
    },
  });

  SwaggerModule.setup('docs', app, buildOpenApiDocument(app), {
    jsonDocumentUrl: 'docs-json',
  });
}
