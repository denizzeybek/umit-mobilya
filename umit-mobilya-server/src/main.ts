import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  setupApp(app);

  const port = Number(process.env['PORT'] ?? 5000);
  await app.listen(port);

  new Logger('Bootstrap').log(`Sunucu ${port} portunda çalışıyor`);
}

void bootstrap();
