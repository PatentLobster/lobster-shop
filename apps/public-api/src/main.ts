import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // CORS configuration (configurable via env)
  app.enableCors({
    origin: config.corsOrigin,
    credentials: config.get('CORS_CREDENTIALS'),
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Graceful shutdown - important for K8s
  app.enableShutdownHooks();

  const port = config.port;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for K8s

  logger.log(`✅ ${config.serviceName} is running on: http://0.0.0.0:${port}/${globalPrefix}`);
  logger.log(`📊 Health: http://0.0.0.0:${port}/api/health`);
  logger.log(`⚙️  Config: http://0.0.0.0:${port}/api/config (frontend runtime config)`);
  logger.log(`🔧 Environment: ${config.nodeEnv}`);
  logger.log(`📡 Kafka: ${config.kafkaBrokers.join(', ')}`);

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, starting graceful shutdown...');
    await app.close();
    logger.log('Application closed');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, starting graceful shutdown...');
    await app.close();
    logger.log('Application closed');
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
