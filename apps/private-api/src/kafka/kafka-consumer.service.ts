import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { ConfigService } from '../config/config.service';
import { PurchaseRepository } from '../database/purchase.repository';
import { KafkaTopic, KafkaConsumerGroup, PurchaseEventPayload } from '@lobster-shop/shared';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;
  private isProcessing = false;

  constructor(
    private readonly config: ConfigService,
    private readonly purchaseRepository: PurchaseRepository
  ) {
    this.kafka = new Kafka({
      clientId: this.config.kafkaClientId,
      brokers: this.config.kafkaBrokers,
      ssl: this.config.getKafkaSsl(),
      sasl: this.config.getKafkaSasl(),
      connectionTimeout: this.config.get('KAFKA_CONNECTION_TIMEOUT_MS'),
      requestTimeout: this.config.get('KAFKA_REQUEST_TIMEOUT_MS'),
      retry: {
        retries: this.config.get('KAFKA_RETRY_ATTEMPTS'),
        initialRetryTime: this.config.get('KAFKA_RETRY_BACKOFF_MS'),
      },
    });

    const groupId = this.config.kafkaGroupId || KafkaConsumerGroup.PURCHASE_PROCESSOR;

    this.consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: this.config.get('KAFKA_CONSUMER_SESSION_TIMEOUT_MS'),
      heartbeatInterval: this.config.get('KAFKA_CONSUMER_HEARTBEAT_INTERVAL_MS'),
      maxBytesPerPartition: 1024 * 1024, // 1MB
      retry: {
        retries: this.config.get('KAFKA_RETRY_ATTEMPTS'),
      },
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      this.isConnected = true;

      await this.consumer.subscribe({
        topic: KafkaTopic.PURCHASES,
        fromBeginning: false, // Only consume new messages
      });

      this.logger.log(
        `✅ Kafka consumer connected: group=${this.config.kafkaGroupId}, topic=${KafkaTopic.PURCHASES}`
      );

      // Start consuming messages
      await this.startConsuming();
    } catch (error) {
      this.logger.error('❌ Failed to connect Kafka consumer', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.isProcessing) {
      this.logger.log('Waiting for message processing to complete...');
      // In production, you'd want a timeout here
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (this.isConnected) {
      await this.consumer.disconnect();
      this.logger.log('Kafka consumer disconnected');
    }
  }

  /**
   * Start consuming messages from Kafka
   */
  private async startConsuming() {
    await this.consumer.run({
      autoCommit: true,
      autoCommitInterval: this.config.get('KAFKA_CONSUMER_AUTO_COMMIT_INTERVAL_MS'),
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    this.logger.log('🔄 Kafka consumer started processing messages');
  }

  /**
   * Handle incoming Kafka message
   */
  private async handleMessage(payload: EachMessagePayload) {
    const { topic, partition, message } = payload;

    try {
      this.isProcessing = true;

      const value = message.value?.toString();
      if (!value) {
        this.logger.warn('Received empty message, skipping');
        return;
      }

      const event: PurchaseEventPayload = JSON.parse(value);
      const eventId = message.headers?.['event-id']?.toString() || event.eventId;

      this.logger.log(
        `Processing purchase event: eventId=${eventId}, userId=${event.userId}, partition=${partition}`
      );

      // Save to MongoDB (idempotent)
      await this.purchaseRepository.save(event);

      this.logger.log(`✅ Purchase processed successfully: eventId=${eventId}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to process message: topic=${topic}, partition=${partition}, offset=${message.offset}`,
        error
      );
      // In production, you'd send to DLQ (Dead Letter Queue)
      // For now, we log and continue
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Health check for Kafka consumer
   */
  async isHealthy(): Promise<boolean> {
    return this.isConnected;
  }

  /**
   * Get consumer lag metrics (for KEDA scaling)
   */
  async getConsumerLag(): Promise<number> {
    // This would typically query Kafka for consumer group lag
    // For now, return 0 as placeholder
    return 0;
  }
}