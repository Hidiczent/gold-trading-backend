import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { walletRouter } from './modules/wallets/wallet.routes';
import { goldPriceRouter } from './modules/gold-price/gold-price.routes';
import { tradeRouter, goldHoldingRouter } from './modules/trades/trade.routes';
import { transactionRouter } from './modules/transactions/transaction.routes';
import { adminRouter, broadcastPublicRouter } from './modules/admin/admin.routes';
import { errorHandler } from './common/middleware/error-handler.middleware';
import { globalRateLimiter } from './common/middleware/rate-limit.middleware';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(globalRateLimiter);

  app.use('/health', healthRouter);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  const v1 = express.Router();
  v1.use('/auth', authRouter);
  v1.use('/wallet', walletRouter);
  v1.use('/gold-price', goldPriceRouter);
  v1.use('/gold-holdings', goldHoldingRouter);
  v1.use('/trades', tradeRouter);
  v1.use('/transactions', transactionRouter);
  v1.use('/admin', adminRouter);
  v1.use('/broadcasts', broadcastPublicRouter);

  app.use('/api/v1', v1);

  app.use(errorHandler);

  return app;
}
