import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';
import { ConfigService } from '../config/config.service';

@Injectable()
export class MongoDbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoDbService.name);
  // @ts-ignore
  private client: MongoClient;
  // @ts-ignore
  private db: Db;
  private isConnected = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = new MongoClient(this.config.mongoUri, {
        minPoolSize: this.config.get('MONGODB_MIN_POOL_SIZE'),
        maxPoolSize: this.config.get('MONGODB_MAX_POOL_SIZE'),
        connectTimeoutMS: this.config.get('MONGODB_CONNECT_TIMEOUT_MS'),
        serverSelectionTimeoutMS: this.config.get('MONGODB_SERVER_SELECTION_TIMEOUT_MS'),
      });

      await this.client.connect();
      this.db = this.client.db(this.config.mongoDatabase);
      this.isConnected = true;

      // Create indexes
      await this.createIndexes();

      this.logger.log(`✅ MongoDB connected: ${this.config.mongoDatabase}`);
    } catch (error) {
      this.logger.error('❌ Failed to connect to MongoDB', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected && this.client) {
      await this.client.close();
      this.logger.log('MongoDB disconnected');
    }
  }

  /**
   * Get the database instance
   */
  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Check MongoDB connection health
   */
  async isHealthy(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.db('admin').command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create database indexes for performance
   */
  private async createIndexes() {
    const purchasesCollection = this.db.collection('purchases');

    // Index on userId for fast queries
    await purchasesCollection.createIndex({ userId: 1 });

    // Index on timestamp for sorting
    await purchasesCollection.createIndex({ timestamp: -1 });

    // Unique index on eventId for idempotency
    await purchasesCollection.createIndex({ eventId: 1 }, { unique: true });

    this.logger.log('Database indexes created');
  }
}