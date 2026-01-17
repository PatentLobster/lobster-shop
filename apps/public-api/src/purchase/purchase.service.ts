import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import axios from 'axios';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { ConfigService } from '../config/config.service';
import { BuyRequestDto } from '@lobster-shop/shared';
import type { PurchaseEventPayload, GetBuysResponse } from '@lobster-shop/shared';

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

  constructor(
    private readonly kafkaProducer: KafkaProducerService,
    private readonly config: ConfigService
  ) {}

  /**
   * Create a purchase by sending event to Kafka
   */
  async createPurchase(buyRequest: BuyRequestDto): Promise<string> {
    const eventId = randomUUID();

    const payload: PurchaseEventPayload = {
      username: buyRequest.username,
      userId: buyRequest.userId,
      price: buyRequest.price,
      productName: buyRequest.productName,
      description: buyRequest.description,
      timestamp: new Date().toISOString(),
      eventId,
    };

    await this.kafkaProducer.sendPurchaseEvent(payload);

    this.logger.log(`Purchase event queued: eventId=${eventId}`);

    return eventId;
  }

  /**
   * Get user purchases by proxying to private-api
   */
  async getUserPurchases(userId: string): Promise<GetBuysResponse> {
    const privateApiUrl = this.config.get('PRIVATE_API_URL');

    if (!privateApiUrl) {
      throw new Error('PRIVATE_API_URL not configured');
    }

    try {
      const response = await axios.get<GetBuysResponse>(`${privateApiUrl}/api/purchases`, {
        params: { userId },
        timeout: 5000,
      });

      this.logger.log(`Fetched ${response.data.purchases.length} purchases for userId=${userId}`);

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch purchases from private-api: ${error}`);
      throw new Error('Failed to fetch purchases');
    }
  }
}