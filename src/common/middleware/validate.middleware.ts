import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[part]);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    switch (part) {
      case 'body':
        req.body = parsed.data as Record<string, unknown>;
        break;
      case 'query':
        req.query = parsed.data as Request['query'];
        break;
      case 'params':
        req.params = parsed.data as Request['params'];
        break;
      default:
        break;
    }
    next();
  };
}
