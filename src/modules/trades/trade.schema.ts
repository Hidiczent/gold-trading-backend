import { z } from 'zod';
import { positiveAmountSchema, paginationSchema } from '../../common/schemas/common.schema';
import { TradeType } from '../../common/constants/enums';

export const tradeAmountSchema = z.object({
  goldAmount: positiveAmountSchema,
});

export const tradeListQuerySchema = paginationSchema.extend({
  type: z.nativeEnum(TradeType).optional(),
});
