/**
 * Kafka topics used across the system
 */
export enum KafkaTopic {
  PURCHASES = 'purchases',
}

/**
 * Kafka consumer groups
 */
export enum KafkaConsumerGroup {
  PURCHASE_PROCESSOR = 'purchase-processor-group',
}

/**
 * Environment types for runtime configuration
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}