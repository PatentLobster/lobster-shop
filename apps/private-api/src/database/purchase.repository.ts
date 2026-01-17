import { Injectable, Logger } from '@nestjs/common';
import { Collection } from 'mongodb';
import { MongoDbService } from './mongodb.service';
import type { Purchase, PurchaseEventPayload } from '@lobster-shop/shared';

interface PurchaseDocument {
  _id?: string;
  id: string;
  userId: string;
  username: string;
  price: number;
  timestamp: Date;
  productName?: string;
  description?: string;
  eventId: string;
  createdAt: Date;
}

@Injectable()
export class PurchaseRepository {
  private readonly logger = new Logger(PurchaseRepository.name);
  private readonly collectionName = 'purchases';

  constructor(private readonly mongodb: MongoDbService) {}

  private getCollection(): Collection<PurchaseDocument> {
    return this.mongodb.getDb().collection<PurchaseDocument>(this.collectionName);
  }

  /**
   * Save a purchase to MongoDB
   * Uses eventId for idempotency - duplicate events are ignored
   */
  async save(event: PurchaseEventPayload): Promise<Purchase> {
    const collection = this.getCollection();

    const document: PurchaseDocument = {
      id: event.eventId,
      userId: event.userId,
      username: event.username,
      price: event.price,
      timestamp: new Date(event.timestamp),
      productName: event.productName,
      description: event.description,
      eventId: event.eventId,
      createdAt: new Date(),
    };

    try {
      await collection.insertOne(document);
      this.logger.log(`Purchase saved: eventId=${event.eventId}, userId=${event.userId}`);

      return this.toDomain(document);
    } catch (error: any) {
      // Handle duplicate key error (idempotency)
      if (error.code === 11000) {
        this.logger.warn(`Duplicate purchase event ignored: eventId=${event.eventId}`);
        const existing = await collection.findOne({ eventId: event.eventId });
        if (existing) {
          return this.toDomain(existing);
        }
      }
      throw error;
    }
  }



  /**
   * Find all purchases for a user
   */
  async findByUserId(userId: string, limit = 100, offset = 0): Promise<Purchase[]> {
    const collection = this.getCollection();

    const documents = await collection
      .find({ userId })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return documents.map((doc) => this.toDomain(doc));
  }

  /**
   * Count total purchases for a user
   */
  async countByUserId(userId: string): Promise<number> {
    const collection = this.getCollection();
    return collection.countDocuments({ userId });
  }

  /**
   * Convert MongoDB document to domain entity
   */
  private toDomain(document: PurchaseDocument): Purchase {
    return {
      id: document.id,
      userId: document.userId,
      username: document.username,
      price: document.price,
      timestamp: document.timestamp,
      productName: document.productName,
      description: document.description,
    };
  }
}