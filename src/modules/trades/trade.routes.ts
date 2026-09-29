import { Router, type IRouter } from 'express';
import { tradeController } from './trade.controller';
import { tradeAmountSchema, tradeListQuerySchema } from './trade.schema';
import { validate } from '../../common/middleware/validate.middleware';
import {
  authenticate,
  requireActiveUser,
  requireAuth,
} from '../../common/middleware/auth.middleware';
import { financialRateLimiter } from '../../common/middleware/rate-limit.middleware';

export const tradeRouter: IRouter = Router();
export const goldHoldingRouter: IRouter = Router();

tradeRouter.use(authenticate, requireAuth, requireActiveUser);

tradeRouter.post('/buy', financialRateLimiter, validate(tradeAmountSchema), tradeController.buy);
tradeRouter.post('/sell', financialRateLimiter, validate(tradeAmountSchema), tradeController.sell);
tradeRouter.get('/', validate(tradeListQuerySchema, 'query'), tradeController.list);

goldHoldingRouter.use(authenticate, requireAuth);
goldHoldingRouter.get('/', tradeController.getHolding);
