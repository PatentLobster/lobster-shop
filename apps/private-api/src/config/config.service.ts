import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { PrivateApiConfig, Environment } from '@lobster-shop/shared';

@Injectable()
export class ConfigService {
  constructor(private readonly nestConfig: NestConfigService<PrivateApiConfig, true>) {}

  get<K extends keyof PrivateApiConfig>(key: K): PrivateApiConfig[K] {
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

  // Kafka Configuration
  get kafkaBrokers(): string[] {
    return this.get('KAFKA_BROKERS');
  }

  get kafkaClientId(): string {
    return this.get('KAFKA_CLIENT_ID');
  }

  get kafkaGroupId(): string | undefined {
    return this.nestConfig.get('KAFKA_GROUP_ID');
  }

  // MongoDB Configuration
  get mongoUri(): string {
    return this.get('MONGODB_URI');
  }

  get mongoDatabase(): string {
    return this.get('MONGODB_DATABASE');
  }

  get shutdownTimeout(): number {
    return this.get('SHUTDOWN_TIMEOUT_MS');
  }

  getKafkaSsl(): boolean {
    return this.get('KAFKA_SSL_ENABLED');
  }

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