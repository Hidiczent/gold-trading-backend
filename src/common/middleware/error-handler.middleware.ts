import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, ErrorCodes } from '../errors/app-error';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((i) => i.message).join('; ');
    res.status(422).json({
      error: { code: ErrorCodes.VALIDATION_ERROR, message },
    });
    return;
  }

  logger.error('Unhandled error', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message:
        env.NODE_ENV === 'production' ? 'Internal server error' : (err as Error)?.message ?? 'Error',
    },
  });
}
