import { Router, type IRouter } from 'express';
import { adminController } from './admin.controller';
import {
  adminUserListQuerySchema,
  adminTransactionQuerySchema,
  adminTradeQuerySchema,
  balanceAdjustmentSchema,
  userIdParamSchema,
  broadcastSchema,
} from './admin.schema';
import { validate } from '../../common/middleware/validate.middleware';
import {
  authenticate,
  requireAuth,
  requireRole,
} from '../../common/middleware/auth.middleware';
import { UserRole } from '../../common/constants/enums';
import { adminService } from './admin.service';
import { asyncHandler } from '../../common/utils/async-handler';

export const adminRouter: IRouter = Router();
export const broadcastPublicRouter: IRouter = Router();

adminRouter.use(authenticate, requireAuth, requireRole(UserRole.ADMIN));

adminRouter.get('/users', validate(adminUserListQuerySchema, 'query'), adminController.listUsers);
adminRouter.get(
  '/transactions',
  validate(adminTransactionQuerySchema, 'query'),
  adminController.listTransactions,
);
adminRouter.get('/trades', validate(adminTradeQuerySchema, 'query'), adminController.listTrades);
adminRouter.post(
  '/users/:userId/balance-adjustment',
  validate(userIdParamSchema, 'params'),
  validate(balanceAdjustmentSchema),
  adminController.adjustBalance,
);
adminRouter.post(
  '/users/:userId/deactivate',
  validate(userIdParamSchema, 'params'),
  adminController.deactivateUser,
);
adminRouter.post('/broadcasts', validate(broadcastSchema), adminController.createBroadcast);

broadcastPublicRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const data = await adminService.listActiveBroadcasts();
    res.json({ data });
  }),
);
