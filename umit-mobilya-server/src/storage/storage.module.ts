import { Global, Module } from '@nestjs/common';

import { ObjectStorageService } from './object-storage.service';
import { StorageController } from './storage.controller';

@Global()
@Module({
  controllers: [StorageController],
  providers: [ObjectStorageService],
  exports: [ObjectStorageService],
})
export class StorageModule {}
