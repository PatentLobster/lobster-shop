import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import type { HealthCheckResponse, FrontendConfig } from '@lobster-shop/shared';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Kubernetes liveness probe
   * Checks if the application is running
   */
  @Get('health/live')
  async liveness(): Promise<{ status: string }> {
    return { status: 'ok' };
  }

  /**
   * Kubernetes readiness probe
   * Checks if the application is ready to receive traffic
   */
  @Get('health/ready')
  async readiness(): Promise<HealthCheckResponse> {
    return this.healthService.checkHealth();
  }

  /**
   * Detailed health check with all dependencies
   */
  @Get('health')
  async health(): Promise<HealthCheckResponse> {
    return this.healthService.checkHealth();
  }

  /**
   * Frontend runtime configuration endpoint
   * Returns ONLY public, non-sensitive configuration
   */
  @Get('config')
  async getConfig(): Promise<FrontendConfig> {
    return this.healthService.getFrontendConfig();
  }

  /**
   * Prometheus metrics endpoint (for future use)
   */
  @Get('metrics')
  async metrics(): Promise<string> {
    // TODO: Integrate with prom-client or @willsoto/nestjs-prometheus
    return '# Metrics endpoint placeholder\n';
  }
}