import { z } from 'zod';
import { paginationSchema, signedAmountSchema, uuidSchema } from '../../common/schemas/common.schema';
import { TradeType, TransactionType } from '../../common/constants/enums';
import { optionalDateSchema } from '../../common/schemas/common.schema';

export const adminUserListQuerySchema = paginationSchema;

export const adminTransactionQuerySchema = paginationSchema.extend({
  userName: z.string().trim().min(1).optional(),
  type: z.nativeEnum(TransactionType).optional(),
  from: optionalDateSchema,
  to: optionalDateSchema,
});

export const adminTradeQuerySchema = paginationSchema.extend({
  userName: z.string().trim().min(1).optional(),
  type: z.nativeEnum(TradeType).optional(),
});

export const balanceAdjustmentSchema = z.object({
  amount: signedAmountSchema,
  reason: z.string().trim().min(3).max(500),
});

export const userIdParamSchema = z.object({
  userId: uuidSchema,
});

export const broadcastSchema = z.object({
  title: z.string().trim().min(3).max(255),
  message: z.string().trim().min(3).max(2000),
  expiresAt: z.string().datetime().optional(),
});
