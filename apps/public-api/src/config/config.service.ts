import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { PublicApiConfig, FrontendConfig, Environment } from '@lobster-shop/shared';

@Injectable()
export class ConfigService {
  constructor(private readonly nestConfig: NestConfigService<PublicApiConfig, true>) {}

  get<K extends keyof PublicApiConfig>(key: K): PublicApiConfig[K] {
    return this.nestConfig.get(key, { infer: true });
  }

  get port(): number {
    return this.get('PORT');
  }

  get serviceName(): string {
    return this.get('SERVICE_NAME');
  }

  get nodeEnv(): Environment {
    return this.get('NODE_ENV');
  }

  get kafkaBrokers(): string[] {
    return this.get('KAFKA_BROKERS');
  }

  get kafkaClientId(): string {
    return this.get('KAFKA_CLIENT_ID');
  }

  get corsOrigin(): string {
    return this.get('CORS_ORIGIN');
  }

  get shutdownTimeout(): number {
    return this.get('SHUTDOWN_TIMEOUT_MS');
  }

  /**
   * Get public configuration safe for frontend consumption
   * Only includes non-sensitive data
   */
  getFrontendConfig(): FrontendConfig {
    // In K8s, this would typically come from ConfigMap
    const publicApiUrl = process.env.PUBLIC_API_EXTERNAL_URL || `http://localhost:${this.port}`;

    return {
      apiUrl: publicApiUrl,
      environment: this.nodeEnv,
      appName: 'Lobster Shop',
      features: {
        analyticsEnabled: this.nodeEnv === Environment.PRODUCTION,
        debugMode: this.nodeEnv === Environment.DEVELOPMENT,
      },
    };
  }

  /**
   * Get Kafka SSL configuration
   */
  getKafkaSsl(): boolean {
    return this.get('KAFKA_SSL_ENABLED');
  }

  /**
   * Get Kafka SASL configuration
   */
  getKafkaSasl() {
    const mechanism = this.nestConfig.get('KAFKA_SASL_MECHANISM');
    const username = this.nestConfig.get('KAFKA_SASL_USERNAME');
    const password = this.nestConfig.get('KAFKA_SASL_PASSWORD');

    if (!mechanism || !username || !password) {
      return undefined;
    }

    return {
      mechanism: mechanism.toLowerCase() as any,
      username,
      password,
    };
  }
}