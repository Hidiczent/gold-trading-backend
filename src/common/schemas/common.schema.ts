import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const positiveAmountSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, 'Amount must be a positive numeric string')
  .refine((v) => !v.startsWith('-') && parseFloat(v) > 0, 'Amount must be greater than zero');

export const signedAmountSchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/, 'Amount must be a numeric string')
  .refine((v) => parseFloat(v) !== 0, 'Amount must not be zero');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const optionalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .optional();
