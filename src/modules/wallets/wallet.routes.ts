import { Router, type IRouter } from 'express';
import { walletController } from './wallet.controller';
import { walletAmountSchema } from './wallet.schema';
import { validate } from '../../common/middleware/validate.middleware';
import {
  authenticate,
  requireActiveUser,
  requireAuth,
} from '../../common/middleware/auth.middleware';
import { financialRateLimiter } from '../../common/middleware/rate-limit.middleware';

export const walletRouter: IRouter = Router();

walletRouter.use(authenticate, requireAuth, requireActiveUser);

walletRouter.get('/', walletController.getWallet);
walletRouter.post(
  '/deposit',
  financialRateLimiter,
  validate(walletAmountSchema),
  walletController.deposit,
);
walletRouter.post(
  '/withdraw',
  financialRateLimiter,
  validate(walletAmountSchema),
  walletController.withdraw,
);
