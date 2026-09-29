import { AppDataSource } from '../../database/data-source';
import { User } from '../users/user.entity';
import { Trade } from '../trades/trade.entity';
import { Broadcast } from './broadcast.entity';
import { UserStatus } from '../../common/constants/enums';
import { AppError, ErrorCodes } from '../../common/errors/app-error';
import { transactionService } from '../transactions/transaction.service';
import { walletService } from '../wallets/wallet.service';
import { toDecimal, formatMoney, formatGold } from '../../common/utils/decimal';
import { TradeType, TransactionType } from '../../common/constants/enums';
import { logger } from '../../config/logger';

export class AdminService {
  async listUsers(page: number, limit: number) {
    const userRepo = AppDataSource.getRepository(User);
    const [users, total] = await userRepo.findAndCount({
      relations: { wallet: true, goldHolding: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        walletBalance: u.wallet ? formatMoney(toDecimal(u.wallet.balance)) : '0',
        goldHolding: u.goldHolding ? formatGold(toDecimal(u.goldHolding.goldAmount)) : '0.0000',
        createdAt: u.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  listTransactions(filters: {
    page: number;
    limit: number;
    userName?: string;
    type?: TransactionType;
    from?: string;
    to?: string;
  }) {
    return transactionService.list({ ...filters, isAdmin: true });
  }

  async listTrades(filters: {
    page: number;
    limit: number;
    userName?: string;
    type?: TradeType;
  }) {
    const qb = AppDataSource.getRepository(Trade)
      .createQueryBuilder('trade')
      .leftJoinAndSelect('trade.user', 'user')
      .orderBy('trade.timestamp', 'DESC');

    if (filters.userName) {
      qb.andWhere('LOWER(user.name) LIKE LOWER(:userName)', {
        userName: `%${filters.userName}%`,
      });
    }
    if (filters.type) {
      qb.andWhere('trade.type = :type', { type: filters.type });
    }

    const [rows, total] = await qb
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();

    return {
      data: rows.map((t) => ({
        id: t.id,
        userId: t.userId,
        userName: t.user?.name,
        type: t.type,
        goldAmount: formatGold(toDecimal(t.goldAmount)),
        pricePerGram: formatMoney(toDecimal(t.pricePerGram)),
        totalCost: formatMoney(toDecimal(t.totalCost)),
        timestamp: t.timestamp.toISOString(),
      })),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit) || 1,
      },
    };
  }

  async adjustBalance(
    adminId: string,
    userId: string,
    amountStr: string,
    reason: string,
  ): Promise<void> {
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');
    }

    const amount = toDecimal(amountStr);
    const description = `Admin adjustment by ${adminId}: ${reason}`;

    await walletService.adjustBalance(userId, amount, description);
    logger.info('Admin balance adjustment', { adminId, userId, amount: amount.toFixed(8), reason });
  }

  async deactivateUser(userId: string, adminId: string): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');
    }
    user.status = UserStatus.INACTIVE;
    user.deletedAt = new Date();
    await userRepo.save(user);
    logger.info('User deactivated', { userId, adminId });
  }

  async createBroadcast(adminId: string, title: string, message: string, expiresAt?: string) {
    const repo = AppDataSource.getRepository(Broadcast);
    const broadcast = repo.create({
      title,
      message,
      createdBy: adminId,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    await repo.save(broadcast);
    return broadcast;
  }

  async listActiveBroadcasts() {
    const now = new Date();
    const rows = await AppDataSource.getRepository(Broadcast)
      .createQueryBuilder('b')
      .where('b.is_active = true')
      .andWhere('(b.expires_at IS NULL OR b.expires_at > :now)', { now })
      .orderBy('b.created_at', 'DESC')
      .getMany();

    return rows.map((b) => ({
      id: b.id,
      title: b.title,
      message: b.message,
      createdAt: b.createdAt.toISOString(),
      expiresAt: b.expiresAt?.toISOString() ?? null,
    }));
  }
}

export const adminService = new AdminService();
