import { Controller, Get, Query, Logger } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import type { GetBuysResponse } from '@lobster-shop/shared';

@Controller('purchases')
export class PurchaseController {
  private readonly logger = new Logger(PurchaseController.name);

  constructor(private readonly purchaseService: PurchaseService) {}

  /**
   * GET /purchases?userId=xxx
   * Retrieve all purchases for a user
   */
  @Get()
  async getPurchases(
    @Query('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<GetBuysResponse> {
    if (!userId) {
      throw new Error('userId query parameter is required');
    }

    this.logger.log(`Fetching purchases for userId=${userId}`);

    const purchases = await this.purchaseService.getUserPurchases(
      userId,
      limit ? Number(limit) : 100,
      offset ? Number(offset) : 0
    );

    const total = await this.purchaseService.getUserPurchaseCount(userId);

    return {
      purchases,
      total,
      userId,
    };
  }
}