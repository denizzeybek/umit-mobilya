import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import type { INestApplication } from '@nestjs/common';

/**
 * Tarayıcı e2e'sinin konuştuğu sunucu — bellek içi bir mongod üstünde.
 *
 *   yarn e2e:api
 *
 * Neden gerçek dev ortamı değil: bir kapı ancak her makinede koşabiliyorsa
 * kapıdır. Yerel Mongo'ya bağlı bir e2e, çalıştırılamadığı gün "şimdilik
 * atlayalım" olur ve sessizce atlanan kapı, olmayan kapıdır.
 *
 * `NODE_ENV=test` iki iş yapıyor: `ConfigModule` `.env` dosyasını okumuyor
 * (yoksa gerçek Atlas kümesine ve gerçek R2 kovasına ulaşabilirdik) ve
 * kimlikler aşağıdaki sahte değerlerden geliyor.
 *
 * Tohum veri SABİT ObjectId'lerle yazılıyor: `/product-details/:id` gibi
 * parametreli route'lar smoke envanterine ancak öngörülebilir bir kimlikle
 * girebilir.
 */
const PORT = Number(process.env['E2E_API_PORT'] ?? 5055);
const WEB_ORIGIN = process.env['E2E_BASE_URL'] ?? 'http://localhost:3001';

export const E2E_CATEGORY_ID = '600000000000000000000001';
export const E2E_PRODUCT_ID = '600000000000000000000002';
export const E2E_ADMIN_EMAIL = process.env['E2E_ADMIN_EMAIL'] ?? 'e2e@umit.test';
export const E2E_ADMIN_PASSWORD =
  process.env['E2E_ADMIN_PASSWORD'] ?? 'e2e-parola';

const seedTime = new Date('2026-01-01T00:00:00.000Z');

async function seed(uri: string): Promise<void> {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error('Mongo bağlantısı kurulamadı.');

  await db.collection('categories').insertOne({
    _id: new mongoose.Types.ObjectId(E2E_CATEGORY_ID),
    name: 'Gardırop',
    createdAt: seedTime,
  });

  /*
   * Ürün doğrudan yazılıyor çünkü `POST /api/products` bir görsel bekliyor ve
   * görsel R2'ye gidiyor — tohum verinin bir kova çağrısına bağlı olması,
   * hermetik olma iddiasını bozardı. Görselsiz ürün geçerli: `imageUrl` null
   * döner ve arayüz bunu zaten karşılıyor.
   */
  await db.collection('products').insertOne({
    _id: new mongoose.Types.ObjectId(E2E_PRODUCT_ID),
    name: 'Ceviz Gardırop',
    imageNameList: [],
    sizes: '180 x 220 x 60 cm',
    description: 'e2e tohum kaydı.',
    category: new mongoose.Types.ObjectId(E2E_CATEGORY_ID),
    createdAt: seedTime,
  });

  await mongoose.disconnect();
}

async function main(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  const uri = `${mongo.getUri().replace(/\/$/, '')}/e2e`;

  process.env['NODE_ENV'] = 'test';
  process.env['MONGO_URI'] = uri;
  process.env['JWT_SECRET'] = 'e2e-secret';
  process.env['BUCKET_NAME'] = 'e2e-bucket';
  process.env['S3_ENDPOINT'] = 'https://account.r2.cloudflarestorage.com';
  /*
   * Kova adresi dışarıdan verilebiliyor: kaplama deseninin gerçekten çizildiğini
   * görmek için tek yol, adresi görsel SERVİS EDEN bir yere (dev sunucusunun
   * `public/` klasörü) yöneltmek. Varsayılan erişilemez bir alan adı, çünkü
   * hermetik koşumda hiçbir istek dışarı çıkmamalı.
   */
  process.env['PUBLIC_BUCKET_URL'] =
    process.env['E2E_PUBLIC_BUCKET_URL'] ?? 'https://img.e2e';
  process.env['ACCESS_KEY'] = 'e2e-access-key';
  process.env['SECRET_ACCESS_KEY'] = 'e2e-secret-key';
  process.env['ALLOWED_ORIGINS'] = WEB_ORIGIN;

  await seed(uri);

  /*
   * Dinamik import bilinçli: `ConfigModule.forRoot()` ortamı `@Module`
   * dekoratörü değerlendirilirken doğruluyor, yani MODÜL IMPORT EDİLİRKEN.
   * Statik import yukarıdaki atamalardan önce çalışır ve boot "zorunlu ortam
   * değişkenleri eksik" diye düşer.
   */
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../src/app.module');
  const { setupApp } = await import('../src/setup-app');

  const app: INestApplication = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  setupApp(app);
  await app.listen(PORT);

  /*
   * Yönetim ekranlarının smoke'a girebilmesi için bir hesap. Kayıt HTTP'den
   * geçiyor ki parola hash'i gerçek Mongoose hook'undan çıksın — doğrudan
   * yazılan bir kullanıcıyla giriş yapılamazdı.
   */
  const signup = await fetch(`http://127.0.0.1:${PORT}/api/auth/signup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: E2E_ADMIN_EMAIL,
      password: E2E_ADMIN_PASSWORD,
    }),
  });

  if (!signup.ok) {
    throw new Error(`e2e yöneticisi oluşturulamadı: ${signup.status}`);
  }

  process.stdout.write(`e2e api hazır: http://localhost:${PORT}/api\n`);

  const shutdown = async (): Promise<void> => {
    await app.close();
    await mongo.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

main().catch((error: unknown) => {
  process.stderr.write(`e2e api başlatılamadı: ${String(error)}\n`);
  process.exit(1);
});
