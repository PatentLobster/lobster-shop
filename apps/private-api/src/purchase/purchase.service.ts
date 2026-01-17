import { Injectable } from '@nestjs/common';
import { PurchaseRepository } from '../database/purchase.repository';
import type { Purchase } from '@lobster-shop/shared';

@Injectable()
export class PurchaseService {
  constructor(private readonly purchaseRepository: PurchaseRepository) {}

  /**
   * Get all purchases for a user
   */
  async getUserPurchases(userId: string, limit = 100, offset = 0): Promise<Purchase[]> {
    return this.purchaseRepository.findByUserId(userId, limit, offset);
  }

  /**
   * Get total count of purchases for a user
   */
  async getUserPurchaseCount(userId: string): Promise<number> {
    return this.purchaseRepository.countByUserId(userId);
  }
}