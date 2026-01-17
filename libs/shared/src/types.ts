// ============================================================================
// Domain Types
// ============================================================================

/**
 * Purchase entity stored in MongoDB
 */
export interface Purchase {
  id: string;
  userId: string;
  username: string;
  price: number;
  timestamp: Date;
  productName?: string;
  description?: string;
}

/**
 * Purchase request from frontend/public-api
 */
export interface BuyRequest {
  username: string;
  userId: string;
  price: number;
  productName?: string;
  description?: string;
}

/**
 * Response after purchase submission
 */
export interface BuyResponse {
  success: boolean;
  message: string;
  purchaseId?: string;
}

/**
 * Response for getting all user purchases
 */
export interface GetBuysResponse {
  purchases: Purchase[];
  total: number;
  userId: string;
}

// ============================================================================
// Kafka Message Types
// ============================================================================

/**
 * Kafka message payload for purchase events
 * Sent by public-api, consumed by private-api
 */
export interface PurchaseEventPayload {
  username: string;
  userId: string;
  price: number;
  productName?: string;
  description?: string;
  timestamp: string; // ISO 8601 format
  eventId: string; // Idempotency key
}

/**
 * Kafka message envelope with metadata
 */
export interface KafkaMessage<T = unknown> {
  key: string; // Partition key (e.g., userId for ordering)
  value: T;
  headers?: Record<string, string>;
  timestamp?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard error response
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  path?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================================================
// Health Check Types
// ============================================================================

/**
 * Health check result for individual dependency
 */
export interface HealthCheckResult {
  status: 'up' | 'down';
  message?: string;
  latency?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Overall health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  timestamp: number;
  uptime: number;
  checks: {
    kafka?: HealthCheckResult;
    mongodb?: HealthCheckResult;
    memory?: HealthCheckResult;
  };
}