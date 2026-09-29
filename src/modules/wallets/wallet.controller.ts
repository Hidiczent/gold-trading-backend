import { Request, Response, NextFunction } from 'express';
import { walletService } from './wallet.service';

export class WalletController {
  getWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await walletService.getBalance(req.user!.id);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  deposit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { amount } = req.body as { amount: string };
      const data = await walletService.deposit(req.user!.id, amount);
      res.status(200).json({ message: 'Deposit successful', data });
    } catch (error) {
      next(error);
    }
  };

  withdraw = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { amount } = req.body as { amount: string };
      const data = await walletService.withdraw(req.user!.id, amount);
      res.status(200).json({ message: 'Withdrawal successful', data });
    } catch (error) {
      next(error);
    }
  };
}

export const walletController = new WalletController();
