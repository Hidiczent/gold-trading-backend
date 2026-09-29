import 'reflect-metadata';
import { createApp } from './app';
import type { Express } from 'express';
import { env } from './config/env';
import { logger } from './config/logger';
import { AppDataSource } from './database/data-source';
import { formatUnknownError } from './common/utils/format-error';

async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected');

    const app: Express = createApp();
    app.listen(env.PORT, () => {
      logger.info('Server started', { port: env.PORT });
    });
  } catch (error) {
    const message = formatUnknownError(error);
    const hint =
      message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')
        ? 'Start PostgreSQL first (e.g. docker compose up -d postgres). For local dev use DATABASE_HOST=localhost in .env; inside Docker use DATABASE_HOST=postgres.'
        : undefined;

    logger.error('Failed to start server', {
      error: message,
      ...(hint ? { hint } : {}),
    });
    process.exit(1);
  }
}

void bootstrap();
