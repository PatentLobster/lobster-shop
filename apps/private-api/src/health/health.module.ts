import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { KafkaModule } from '../kafka/kafka.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [KafkaModule, DatabaseModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}