import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { KafkaModule } from '../kafka/kafka.module';
import { PurchaseModule } from '../purchase/purchase.module';
import { HealthModule } from '../health/health.module';

@Module({
  imports: [ConfigModule, DatabaseModule, KafkaModule, PurchaseModule, HealthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
