import { Module } from '@nestjs/common';
import { MongoDbService } from './mongodb.service';
import { PurchaseRepository } from './purchase.repository';

@Module({
  providers: [MongoDbService, PurchaseRepository],
  exports: [MongoDbService, PurchaseRepository],
})
export class DatabaseModule {}