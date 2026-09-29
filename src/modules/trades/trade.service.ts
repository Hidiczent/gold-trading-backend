import { AppDataSource } from '../../database/data-source';
import { Wallet } from '../wallets/wallet.entity';
import { GoldHolding } from './gold-holding.entity';
import { Trade } from './trade.entity';
import { Transaction } from '../transactions/transaction.entity';
import { TradeType, TransactionType } from '../../common/constants/enums';
import { AppError, ErrorCodes } from '../../common/errors/app-error';
import { formatGold, formatMoney, toDecimal } from '../../common/utils/decimal';
import { goldPriceService } from '../gold-price/gold-price.service';
import { logger } from '../../config/logger';

export class TradeService {
  async getGoldHolding(userId: string): Promise<{ goldAmount: string; unit: string }> {
    const holding = await AppDataSource.getRepository(GoldHolding).findOne({ where: { userId } });
    if (!holding) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Gold holding not found');
    }
    return { goldAmount: formatGold(toDecimal(holding.goldAmount)), unit: 'gram' };
  }

  async buy(userId: string, goldAmountStr: string): Promise<void> {
    const goldAmount = toDecimal(goldAmountStr);
    const pricePerGram = await goldPriceService.getPriceDecimal();
    const totalCost = goldAmount.mul(pricePerGram);

    await AppDataSource.transaction(async (em) => {
      const wallet = await em
        .getRepository(Wallet)
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .where('wallet.user_id = :userId', { userId })
        .getOne();

      if (!wallet) {
        throw new AppError(404, ErrorCodes.NOT_FOUND, 'Wallet not found');
      }

      const balance = toDecimal(wallet.balance);
      if (balance.lt(totalCost)) {
        throw new AppError(400, ErrorCodes.INSUFFICIENT_BALANCE, 'Insufficient wallet balance');
      }

      const holding = await em
        .getRepository(GoldHolding)
        .createQueryBuilder('holding')
        .setLock('pessimistic_write')
        .where('holding.user_id = :userId', { userId })
        .getOne();

      if (!holding) {
        throw new AppError(404, ErrorCodes.NOT_FOUND, 'Gold holding not found');
      }

      wallet.balance = balance.minus(totalCost).toFixed(8);
      holding.goldAmount = toDecimal(holding.goldAmount).plus(goldAmount).toFixed(8);

      await em.save(wallet);
      await em.save(holding);

      const trade = em.create(Trade, {
        userId,
        type: TradeType.BUY,
        goldAmount: goldAmount.toFixed(8),
        pricePerGram: pricePerGram.toFixed(8),
        totalCost: totalCost.toFixed(8),
        timestamp: new Date(),
      });
      await em.save(trade);

      await em.save(
        em.create(Transaction, {
          userId,
          type: TransactionType.TRADE,
          amount: totalCost.toFixed(8),
          timestamp: new Date(),
          referenceId: trade.id,
          description: `Buy ${formatGold(goldAmount)}g gold at ${formatMoney(pricePerGram)} LAK/g`,
        }),
      );
    });

    logger.info('Gold buy trade', { userId, goldAmount: goldAmount.toFixed(8) });
  }

  async sell(userId: string, goldAmountStr: string): Promise<void> {
    const goldAmount = toDecimal(goldAmountStr);
    const pricePerGram = await goldPriceService.getPriceDecimal();
    const totalCost = goldAmount.mul(pricePerGram);

    await AppDataSource.transaction(async (em) => {
      const holding = await em
        .getRepository(GoldHolding)
        .createQueryBuilder('holding')
        .setLock('pessimistic_write')
        .where('holding.user_id = :userId', { userId })
        .getOne();

      if (!holding) {
        throw new AppError(404, ErrorCodes.NOT_FOUND, 'Gold holding not found');
      }

      const owned = toDecimal(holding.goldAmount);
      if (owned.lt(goldAmount)) {
        throw new AppError(400, ErrorCodes.INSUFFICIENT_GOLD, 'Insufficient gold balance');
      }

      holding.goldAmount = owned.minus(goldAmount).toFixed(8);
      await em.save(holding);

      const wallet = await em
        .getRepository(Wallet)
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .where('wallet.user_id = :userId', { userId })
        .getOne();

      if (!wallet) {
        throw new AppError(404, ErrorCodes.NOT_FOUND, 'Wallet not found');
      }

      wallet.balance = toDecimal(wallet.balance).plus(totalCost).toFixed(8);
      await em.save(wallet);

      const trade = em.create(Trade, {
        userId,
        type: TradeType.SELL,
        goldAmount: goldAmount.toFixed(8),
        pricePerGram: pricePerGram.toFixed(8),
        totalCost: totalCost.toFixed(8),
        timestamp: new Date(),
      });
      await em.save(trade);

      await em.save(
        em.create(Transaction, {
          userId,
          type: TransactionType.TRADE,
          amount: totalCost.toFixed(8),
          timestamp: new Date(),
          referenceId: trade.id,
          description: `Sell ${formatGold(goldAmount)}g gold at ${formatMoney(pricePerGram)} LAK/g`,
        }),
      );
    });

    logger.info('Gold sell trade', { userId, goldAmount: goldAmount.toFixed(8) });
  }

  async listTrades(
    userId: string,
    page: number,
    limit: number,
    type?: TradeType,
  ): Promise<{ data: Trade[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const qb = AppDataSource.getRepository(Trade)
      .createQueryBuilder('trade')
      .where('trade.user_id = :userId', { userId })
      .orderBy('trade.timestamp', 'DESC');

    if (type) {
      qb.andWhere('trade.type = :type', { type });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const tradeService = new TradeService();
