import { Request, Response, NextFunction } from 'express';
import { transactionService } from './transaction.service';
import { TransactionType } from '../../common/constants/enums';
import { UserRole } from '../../common/constants/enums';

export class TransactionController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, userName, type, from, to } = req.query as unknown as {
        page: number;
        limit: number;
        userName?: string;
        type?: TransactionType;
        from?: string;
        to?: string;
      };

      const isAdmin = req.user!.role === UserRole.ADMIN;
      const result = await transactionService.list({
        page,
        limit,
        userName: isAdmin ? userName : undefined,
        type,
        from,
        to,
        userId: req.user!.id,
        isAdmin,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const transactionController = new TransactionController();
