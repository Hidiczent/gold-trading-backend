import { Router, type IRouter, Request, Response, NextFunction } from 'express';
import { goldPriceService } from './gold-price.service';

export const goldPriceRouter: IRouter = Router();

goldPriceRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const price = await goldPriceService.getPrice();
    res.json({ data: price });
  } catch (error) {
    next(error);
  }
});
