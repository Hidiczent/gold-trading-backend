import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { TransactionType, TradeType } from '../../common/constants/enums';

export class AdminController {
  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await adminService.listUsers(page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  listTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, userName, type, from, to } = req.query as unknown as {
        page: number;
        limit: number;
        userName?: string;
        type?: TransactionType;
        from?: string;
        to?: string;
      };
      const result = await adminService.listTransactions({
        page,
        limit,
        userName,
        type,
        from,
        to,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  listTrades = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, userName, type } = req.query as unknown as {
        page: number;
        limit: number;
        userName?: string;
        type?: TradeType;
      };
      const result = await adminService.listTrades({ page, limit, userName, type });
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  adjustBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params as { userId: string };
      const { amount, reason } = req.body as { amount: string; reason: string };
      await adminService.adjustBalance(req.user!.id, userId, amount, reason);
      res.json({ message: 'Balance adjusted successfully' });
    } catch (error) {
      next(error);
    }
  };

  deactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params as { userId: string };
      await adminService.deactivateUser(userId, req.user!.id);
      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      next(error);
    }
  };

  createBroadcast = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, message, expiresAt } = req.body as {
        title: string;
        message: string;
        expiresAt?: string;
      };
      const data = await adminService.createBroadcast(req.user!.id, title, message, expiresAt);
      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();
