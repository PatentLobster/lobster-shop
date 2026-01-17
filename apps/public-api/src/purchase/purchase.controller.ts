import { Controller, Post, Body, Get, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { BuyRequestDto } from '@lobster-shop/shared';
import type { BuyResponse, GetBuysResponse } from '@lobster-shop/shared';

@Controller('purchase')
export class PurchaseController {
  private readonly logger = new Logger(PurchaseController.name);

  constructor(private readonly purchaseService: PurchaseService) {}

  @Post('buy')
  @HttpCode(HttpStatus.ACCEPTED)
  async buy(@Body() buyRequest: BuyRequestDto): Promise<BuyResponse> {
    this.logger.log(`Purchase request received: userId=${buyRequest.userId}, price=${buyRequest.price}`);

    try {
      const purchaseId = await this.purchaseService.createPurchase(buyRequest);

      return {
        success: true,
        message: 'Purchase request accepted and queued for processing',
        purchaseId,
      };
    } catch (error) {
      this.logger.error('Purchase request failed', error);
      return {
        success: false,
        message: 'Failed to process purchase request',
      };
    }
  }

  /**
   * GET /purchase/list?userId=xxx
   * Proxy endpoint to private-api to fetch user purchases
   */
  @Get('list')
  async getPurchases(@Query('userId') userId: string): Promise<GetBuysResponse> {
    this.logger.log(`Fetching purchases for userId=${userId}`);

    try {
      return await this.purchaseService.getUserPurchases(userId);
    } catch (error) {
      this.logger.error('Failed to fetch purchases', error);
      throw error;
    }
  }
}