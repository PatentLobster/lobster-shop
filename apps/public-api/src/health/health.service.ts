import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import type { HealthCheckResponse, FrontendConfig } from '@lobster-shop/shared';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly config: ConfigService,
    private readonly kafkaProducer: KafkaProducerService
  ) {}

  /**
   * Check health of all dependencies
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    const kafkaHealth = await this.checkKafkaHealth();
    const memoryHealth = this.checkMemoryHealth();

    const allHealthy = kafkaHealth.status === 'up' && memoryHealth.status === 'up';
    const anyDown = kafkaHealth.status === 'down' || memoryHealth.status === 'down';

    return {
      status: allHealthy ? 'healthy' : anyDown ? 'unhealthy' : 'degraded',
      service: this.config.serviceName,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      checks: {
        kafka: kafkaHealth,
        memory: memoryHealth,
      },
    };
  }

  /**
   * Check Kafka producer health
   */
  private async checkKafkaHealth() {
    const start = Date.now();
    try {
      const isHealthy = await this.kafkaProducer.isHealthy();
      return {
        status: isHealthy ? ('up' as const) : ('down' as const),
        latency: Date.now() - start,
        message: isHealthy ? 'Kafka producer connected' : 'Kafka producer disconnected',
      };
    } catch (error) {
      return {
        status: 'down' as const,
        latency: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check memory usage
   */
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

  /**
   * Get frontend configuration (public only)
   */
  getFrontendConfig(): FrontendConfig {
    return this.config.getFrontendConfig();
  }
}