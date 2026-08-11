import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CategoryModule } from './category/category.module';
import { validateEnvironment } from './config/env.validation';

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
    CategoryModule,
  ],
})
export class AppModule {}
