import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import { ErrorCodes } from '../errors/app-error';

const jsonHandler = (_req: unknown, res: import('express').Response): void => {
  res.status(429).json({
    error: {
      code: ErrorCodes.TOO_MANY_REQUESTS,
      message: 'Too many requests, please try again later',
    },
  });
};

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

export const financialRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_FINANCIAL_WINDOW_MS,
  max: env.RATE_LIMIT_FINANCIAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});
