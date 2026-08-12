import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

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
     */
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    StorageModule,
    AuthModule,
    CategoryModule,
    ProductModule,
    ConfiguratorModule,
    QuoteModule,
  ],
})
export class AppModule {}
