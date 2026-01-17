import { z } from 'zod';
import { Environment, LogLevel } from './enums';

/**
 * Base configuration schema shared by all services
 */
export const BaseConfigSchema = z.object({
  NODE_ENV: z.nativeEnum(Environment).default(Environment.DEVELOPMENT),
  LOG_LEVEL: z.nativeEnum(LogLevel).default(LogLevel.INFO),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  SERVICE_NAME: z.string().min(1),
  // Health check configuration
  HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().default(5000),
  // Graceful shutdown timeout
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().default(30000),
});

/**
 * Kafka configuration schema
 */
export const KafkaConfigSchema = z.object({
  KAFKA_BROKERS: z
    .string()
    .min(1)
    .transform((val) => val.split(',')),
  KAFKA_CLIENT_ID: z.string().min(1),
  KAFKA_GROUP_ID: z.string().optional(),
  // SASL Authentication (optional for local dev)
  KAFKA_SASL_MECHANISM: z.enum(['PLAIN', 'SCRAM-SHA-256', 'SCRAM-SHA-512']).optional(),
  KAFKA_SASL_USERNAME: z.string().optional(),
  KAFKA_SASL_PASSWORD: z.string().optional(),
  // SSL/TLS
  KAFKA_SSL_ENABLED: z.coerce.boolean().default(false),
  // Connection timeouts
  KAFKA_CONNECTION_TIMEOUT_MS: z.coerce.number().default(10000),
  KAFKA_REQUEST_TIMEOUT_MS: z.coerce.number().default(30000),
  // Retry configuration
  KAFKA_RETRY_ATTEMPTS: z.coerce.number().default(5),
  KAFKA_RETRY_BACKOFF_MS: z.coerce.number().default(300),
});

/**
 * MongoDB configuration schema
 */
export const MongoConfigSchema = z.object({
  MONGODB_URI: z.string().url().or(z.string().regex(/^mongodb(\+srv)?:\/\//)),
  MONGODB_DATABASE: z.string().min(1).default('lobster-shop'),
  // Connection pool settings
  MONGODB_MIN_POOL_SIZE: z.coerce.number().default(5),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().default(20),
  // Timeouts
  MONGODB_CONNECT_TIMEOUT_MS: z.coerce.number().default(10000),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().default(5000),
});

/**
 * Public API configuration (includes Kafka producer config)
 */
export const PublicApiConfigSchema = BaseConfigSchema.merge(KafkaConfigSchema).extend({
  // Service discovery
  PRIVATE_API_URL: z.string().url().optional(), // Optional: only needed for direct HTTP calls
  // CORS configuration
  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),
  // Rate limiting
  RATE_LIMIT_TTL: z.coerce.number().default(60),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

/**
 * Private API configuration (includes Kafka consumer + MongoDB)
 */
export const PrivateApiConfigSchema = BaseConfigSchema.merge(KafkaConfigSchema)
  .merge(MongoConfigSchema)
  .extend({
    // Kafka consumer specific
    KAFKA_CONSUMER_SESSION_TIMEOUT_MS: z.coerce.number().default(30000),
    KAFKA_CONSUMER_HEARTBEAT_INTERVAL_MS: z.coerce.number().default(3000),
    // Processing configuration
    KAFKA_CONSUMER_MAX_BATCH_SIZE: z.coerce.number().default(100),
    KAFKA_CONSUMER_AUTO_COMMIT_INTERVAL_MS: z.coerce.number().default(5000),
  });

/**
 * Frontend runtime configuration (public, non-sensitive)
 * This is what gets exposed via /api/config endpoint
 */
export const FrontendConfigSchema = z.object({
  apiUrl: z.string().url(),
  environment: z.nativeEnum(Environment),
  appName: z.string().default('Lobster Shop'),
  features: z
    .object({
      analyticsEnabled: z.boolean().default(false),
      debugMode: z.boolean().default(false),
    })
    .optional(),
});

// TypeScript types inferred from schemas
export type BaseConfig = z.infer<typeof BaseConfigSchema>;
export type KafkaConfig = z.infer<typeof KafkaConfigSchema>;
export type MongoConfig = z.infer<typeof MongoConfigSchema>;
export type PublicApiConfig = z.infer<typeof PublicApiConfigSchema>;
export type PrivateApiConfig = z.infer<typeof PrivateApiConfigSchema>;
export type FrontendConfig = z.infer<typeof FrontendConfigSchema>;

/**
 * Validate configuration with Zod schema
 * Throws detailed validation errors if config is invalid
 */
export function validateConfig<T>(schema: z.ZodSchema<T>, config: unknown): T {
  try {
    return schema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Configuration validation failed:\n${error.message}`);
    }
    throw error;
  }
}