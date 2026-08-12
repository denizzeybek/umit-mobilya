import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PriceBookController } from './pricebook.controller';
import { PriceBookService } from './pricebook.service';
import { PricingService } from './pricing.service';
import { PriceBook, PriceBookSchema } from './schemas/pricebook.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceBook.name, schema: PriceBookSchema },
    ]),
  ],
  controllers: [PriceBookController],
  providers: [PriceBookService, PricingService],
  exports: [PriceBookService, PricingService],
})
export class ConfiguratorModule {}
