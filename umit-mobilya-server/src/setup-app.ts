import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { Express } from 'express';

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
  /*
   * Railway istekleri bir vekil üstünden geçiriyor, yani `req.ip` vekilin
   * adresi oluyor. Hız sınırı IP başına sayıyor (`ThrottlerGuard.getTracker`
   * → `req.ip`), dolayısıyla bu satır olmadan CANLIDA bütün ziyaretçiler tek
   * bir kovayı paylaşırdı: bir kişinin trafiği herkese 429 yedirirdi.
   *
   * `1` bilinçli, `true` değil: yalnızca ilk atlama (Railway'in vekili)
   * güveniliyor. `true` istemcinin uydurduğu `X-Forwarded-For` başlığına da
   * inanır ve sınır tek satır başlıkla atlanır.
   */
  const httpServer: Express = app.getHttpAdapter().getInstance();
  httpServer.set('trust proxy', 1);

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
