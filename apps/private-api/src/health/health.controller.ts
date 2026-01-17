import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import type { HealthCheckResponse } from '@lobster-shop/shared';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Kubernetes liveness probe
   */
  @Get('health/live')
  async liveness(): Promise<{ status: string }> {
    return { status: 'ok' };
  }

  /**
   * Kubernetes readiness probe
   */
  @Get('health/ready')
  async readiness(): Promise<HealthCheckResponse> {
    return this.healthService.checkHealth();
  }

  /**
   * Detailed health check
   */
  @Get('health')
  async health(): Promise<HealthCheckResponse> {
    return this.healthService.checkHealth();
  }

  /**
   * Prometheus metrics endpoint (placeholder)
   */
  @Get('metrics')
  async metrics(): Promise<string> {
    return '# Metrics endpoint placeholder\n';
  }
}