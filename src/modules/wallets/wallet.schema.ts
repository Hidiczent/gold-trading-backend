import { z } from 'zod';
import { positiveAmountSchema } from '../../common/schemas/common.schema';

export const walletAmountSchema = z.object({
  amount: positiveAmountSchema,
});
