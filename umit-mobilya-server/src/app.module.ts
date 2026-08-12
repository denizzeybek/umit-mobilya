import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { ConfiguratorModule } from './configurator/configurator.module';
import { validateEnvironment } from './config/env.validation';
import { ProductModule } from './product/product.module';
import { QuoteModule } from './quote/quote.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      /*
       * Under Jest the environment comes from test/setup-env.ts with
       * deliberately fake values. Reading .env there would let a spec reach the
       * real Atlas cluster and the real R2 bucket.
       */
      ignoreEnvFile: process.env['NODE_ENV'] === 'test',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    /*
     * Teklif ucu herkese açık olmak zorunda (müşteri oturum açmıyor), o
     * yüzden hız sınırı bir güvenlik önlemi değil, o ucun ön koşulu.
     *
     * Buradaki tavan GENEL taban: teklif ucunun kendi sınırı (dakikada 5)
     * `quote.controller.ts` üstündeki `@Throttle` ile.
     *
     * 300, ölçülmüş bir sayı: bir sayfa açılışı katalog + ürünler + oturum
     * için ~4 istek atıyor, e2e smoke'un tamamı tek IP'den ~50. Önceki değer
     * olan 60 gerçek bir gezinti oturumunu keserdi — ve kimse fark etmezdi,
     * çünkü sınır zaten hiç uygulanmıyordu (aşağıya bak).
     */
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ ttl: 60_000, limit: 300 }],
        /*
         * Testler sınırı kapatabilsin diye. Varsayılan AÇIK: değişken
         * tanımlanmamışsa sınır uygulanır, yani canlıda unutulması korumayı
         * kaldırmıyor.
         *
         * Guard'ı DI ile değiştirmek denendi ve çalışmadı: `APP_GUARD` altında
         * yaşayan örneğe `overrideProvider`/`overrideGuard` ulaşmıyor, sınır
         * her spec'te açık kalıyordu. Bu bayrak guard'ın kendi desteklediği
         * yol ve tek satırda okunur.
         */
        skipIf: () => config.get<string>('THROTTLE_SKIP') === '1',
      }),
    }),
    StorageModule,
    AuthModule,
    CategoryModule,
    ProductModule,
    ConfiguratorModule,
    QuoteModule,
  ],
  /*
   * `ThrottlerGuard` OLMADAN `ThrottlerModule.forRoot()` ve `@Throttle`
   * hiçbir şey yapmıyordu: modül sayaç altyapısını kuruyor, dekoratör
   * metadata yazıyor, ama okuyan bir guard yoksa her iki taraf da atıl.
   * Teklif ucu aylarca "dakikada 5 istek" korumasına dayanarak public
   * duruyordu ve o koruma yoktu.
   *
   * Genel `APP_GUARD` kaydı NestJS'in önerdiği biçim: sınır varsayılan olarak
   * her ucu kapsıyor, tek tek `@UseGuards` eklemeyi hatırlamaya bağlı değil.
   * Gerekirse bir uç `@SkipThrottle()` ile açıkça dışarı çıkar — atlamak
   * görünür bir karar olur.
   *
   * Bu uygulamada APP_GUARD yalnızca bunu taşıyor; `JwtAuthGuard` route
   * başına bağlı (`test/create-test-app.ts` bu ayrıma güveniyor).
   */
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
