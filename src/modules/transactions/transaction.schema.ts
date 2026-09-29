import { z } from 'zod';
import { paginationSchema, optionalDateSchema } from '../../common/schemas/common.schema';
import { TransactionType } from '../../common/constants/enums';

export const transactionListQuerySchema = paginationSchema.extend({
  userName: z.string().trim().min(1).optional(),
  type: z.nativeEnum(TransactionType).optional(),
  from: optionalDateSchema,
  to: optionalDateSchema,
});
