import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

/**
 * The single definition of the published schema.
 *
 * `setup-app.ts` mounts it at `/docs` and `/docs-json`; `tools/dump-openapi.ts`
 * writes the same object to `openapi.json`. One builder means the file the
 * frontend generates from and the schema production serves cannot disagree.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Ümit Mobilya API')
      .setDescription(
        'Frontend istemcisi bu şemadan üretilir (`yarn gcl`). Bir uç burada ' +
          'görünmüyorsa istemcide de yoktur.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
}
