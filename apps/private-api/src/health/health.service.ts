import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';
import { MongoDbService } from '../database/mongodb.service';
import type { HealthCheckResponse } from '@lobster-shop/shared';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly config: ConfigService,
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly mongodb: MongoDbService
  ) {}

  /**
   * Check health of all dependencies
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    const kafkaHealth = await this.checkKafkaHealth();
    const mongoHealth = await this.checkMongoHealth();
    const memoryHealth = this.checkMemoryHealth();

    const allHealthy =
      kafkaHealth.status === 'up' && mongoHealth.status === 'up' && memoryHealth.status === 'up';

    const anyDown =
      kafkaHealth.status === 'down' || mongoHealth.status === 'down' || memoryHealth.status === 'down';

    return {
      status: allHealthy ? 'healthy' : anyDown ? 'unhealthy' : 'degraded',
      service: this.config.serviceName,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      checks: {
        kafka: kafkaHealth,
        mongodb: mongoHealth,
        memory: memoryHealth,
      },
    };
  }

  private async checkKafkaHealth() {
    const start = Date.now();
    try {
      const isHealthy = await this.kafkaConsumer.isHealthy();
      return {
        status: isHealthy ? ('up' as const) : ('down' as const),
        latency: Date.now() - start,
        message: isHealthy ? 'Kafka consumer connected' : 'Kafka consumer disconnected',
      };
    } catch (error) {
      return {
        status: 'down' as const,
        latency: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkMongoHealth() {
    const start = Date.now();
    try {
      const isHealthy = await this.mongodb.isHealthy();
      return {
        status: isHealthy ? ('up' as const) : ('down' as const),
        latency: Date.now() - start,
        message: isHealthy ? 'MongoDB connected' : 'MongoDB disconnected',
      };
    } catch (error) {
      return {
        status: 'down' as const,
        latency: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private checkMemoryHealth() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;

    return {
      status: usagePercent < 90 ? ('up' as const) : ('down' as const),
      message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
      metadata: {
        heapUsedMB,
        heapTotalMB,
        usagePercent: Math.round(usagePercent),
      },
    };
  }
}