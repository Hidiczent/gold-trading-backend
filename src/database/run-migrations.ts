import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { logger } from '../config/logger';
import { formatUnknownError } from '../common/utils/format-error';

async function runMigrations(): Promise<void> {
  try {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    logger.info('Database migrations completed');
    await AppDataSource.destroy();
  } catch (error) {
    logger.error('Migration failed', {
      error: formatUnknownError(error),
    });
    process.exit(1);
  }
}

void runMigrations();
