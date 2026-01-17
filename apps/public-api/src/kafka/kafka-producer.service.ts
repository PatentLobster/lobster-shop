import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { ConfigService } from '../config/config.service';
import { KafkaTopic, PurchaseEventPayload } from '@lobster-shop/shared';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(private readonly config: ConfigService) {
    this.kafka = new Kafka({
      clientId: this.config.kafkaClientId,
      brokers: this.config.kafkaBrokers,
      // ssl: this.config.getKafkaSsl(),
      sasl: this.config.getKafkaSasl(),
      connectionTimeout: this.config.get('KAFKA_CONNECTION_TIMEOUT_MS'),
      requestTimeout: this.config.get('KAFKA_REQUEST_TIMEOUT_MS'),
      retry: {
        retries: this.config.get('KAFKA_RETRY_ATTEMPTS'),
        initialRetryTime: this.config.get('KAFKA_RETRY_BACKOFF_MS'),
      },
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true, // Topics should be created via Strimzi CRDs
      idempotent: true, // Ensure exactly-once semantics
    });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log(`✅ Kafka producer connected to ${this.config.kafkaBrokers.join(', ')}`);
    } catch (error) {
      this.logger.error('❌ Failed to connect Kafka producer', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    }
  }

  /**
   * Send a purchase event to Kafka
   */
  async sendPurchaseEvent(payload: PurchaseEventPayload): Promise<void> {
    try {
      const record: ProducerRecord = {
        topic: KafkaTopic.PURCHASES,
        messages: [
          {
            key: payload.userId, // Partition by userId for ordering
            value: JSON.stringify(payload),
            headers: {
              'event-id': payload.eventId,
              'event-type': 'purchase.created',
              'content-type': 'application/json',
            },
          },
        ],
      };

      const result = await this.producer.send(record);

      this.logger.log(
        `Purchase event sent: eventId=${payload.eventId}, userId=${payload.userId}, partition=${result[0].partition}`
      );
    } catch (error) {
      this.logger.error('Failed to send purchase event', error);
      throw error;
    }
  }

  /**
   * Health check for Kafka producer
   */
  async isHealthy(): Promise<boolean> {
    return this.isConnected;
  }
}