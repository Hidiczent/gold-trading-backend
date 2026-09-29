import { EntityManager } from 'typeorm';
import { AppDataSource } from '../../database/data-source';
import { Wallet } from './wallet.entity';
import { Transaction } from '../transactions/transaction.entity';
import { TransactionType } from '../../common/constants/enums';
import { AppError, ErrorCodes } from '../../common/errors/app-error';
import { Decimal, formatMoney, toDecimal } from '../../common/utils/decimal';
import { logger } from '../../config/logger';

export class WalletService {
  async getBalance(userId: string): Promise<{ balance: string; currency: string }> {
    const wallet = await AppDataSource.getRepository(Wallet).findOne({ where: { userId } });
    if (!wallet) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Wallet not found');
    }
    return { balance: formatMoney(toDecimal(wallet.balance)), currency: wallet.currency };
  }

  async deposit(userId: string, amountStr: string): Promise<{ balance: string; currency: string }> {
    const amount = toDecimal(amountStr);
    return this.applyBalanceChange(userId, amount, TransactionType.DEPOSIT, 'deposit');
  }

  async withdraw(userId: string, amountStr: string): Promise<{ balance: string; currency: string }> {
    const amount = toDecimal(amountStr);
    return this.applyBalanceChange(userId, amount, TransactionType.WITHDRAW, 'withdraw');
  }

  async adjustBalance(
    userId: string,
    signedAmount: Decimal,
    description: string,
    manager?: EntityManager,
  ): Promise<void> {
    const run = async (em: EntityManager) => {
      const wallet = await em
        .getRepository(Wallet)
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .where('wallet.user_id = :userId', { userId })
        .getOne();

      if (!wallet) {
        throw new AppError(404, ErrorCodes.NOT_FOUND, 'Wallet not found');
      }

      const newBalance = toDecimal(wallet.balance).plus(signedAmount);
      if (newBalance.isNegative()) {
        throw new AppError(400, ErrorCodes.INSUFFICIENT_BALANCE, 'Insufficient wallet balance');
      }

      wallet.balance = newBalance.toFixed(8);
      await em.save(wallet);

      const type = signedAmount.isPositive() ? TransactionType.DEPOSIT : TransactionType.WITHDRAW;
      await em.save(
        em.create(Transaction, {
          userId,
          type,
          amount: signedAmount.abs().toFixed(8),
          timestamp: new Date(),
          description,
        }),
      );
    };

    if (manager) {
      await run(manager);
      return;
    }
    await AppDataSource.transaction(run);
  }

  private async applyBalanceChange(
    userId: string,
    amount: Decimal,
    type: TransactionType.DEPOSIT | TransactionType.WITHDRAW,
    logType: string,
  ): Promise<{ balance: string; currency: string }> {
    const result = await AppDataSource.transaction(async (em) => {
      const wallet = await em
        .getRepository(Wallet)
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .where('wallet.user_id = :userId', { userId })
        .getOne();

      if (!wallet) {
        throw new AppError(404, ErrorCodes.NOT_FOUND, 'Wallet not found');
      }

      const current = toDecimal(wallet.balance);
      const newBalance =
        type === TransactionType.DEPOSIT ? current.plus(amount) : current.minus(amount);

      if (newBalance.isNegative()) {
        throw new AppError(400, ErrorCodes.INSUFFICIENT_BALANCE, 'Insufficient wallet balance');
      }

      wallet.balance = newBalance.toFixed(8);
      await em.save(wallet);

      await em.save(
        em.create(Transaction, {
          userId,
          type,
          amount: amount.toFixed(8),
          timestamp: new Date(),
        }),
      );

      return { balance: formatMoney(newBalance), currency: wallet.currency };
    });

    logger.info(`Wallet ${logType}`, { userId, amount: amount.toFixed(8) });
    return result;
  }
}

export const walletService = new WalletService();
