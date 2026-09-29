import { Router, type IRouter } from 'express';
import { transactionController } from './transaction.controller';
import { transactionListQuerySchema } from './transaction.schema';
import { validate } from '../../common/middleware/validate.middleware';
import { authenticate, requireAuth } from '../../common/middleware/auth.middleware';

export const transactionRouter: IRouter = Router();

transactionRouter.use(authenticate, requireAuth);
transactionRouter.get('/', validate(transactionListQuerySchema, 'query'), transactionController.list);
