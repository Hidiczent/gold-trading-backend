import { Router, type IRouter, Request, Response } from 'express';
import { AppDataSource } from '../../database/data-source';

export const healthRouter: IRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  const dbOk = AppDataSource.isInitialized;
  const body: { status: string; timestamp: string; database?: string } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
  if (AppDataSource.isInitialized) {
    body.database = dbOk ? 'connected' : 'disconnected';
  }
  res.status(200).json(body);
});
