import { AppDataSource } from '../../database/data-source';
import { Transaction } from './transaction.entity';
import { TransactionType } from '../../common/constants/enums';
import { formatMoney, toDecimal } from '../../common/utils/decimal';

export interface TransactionListFilters {
  page: number;
  limit: number;
  userName?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
  userId?: string;
  isAdmin?: boolean;
}

export class TransactionService {
  async list(filters: TransactionListFilters) {
    const qb = AppDataSource.getRepository(Transaction)
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.user', 'user')
      .orderBy('tx.timestamp', 'DESC');

    if (!filters.isAdmin) {
      qb.andWhere('tx.user_id = :userId', { userId: filters.userId });
    } else if (filters.userName) {
      qb.andWhere('LOWER(user.name) LIKE LOWER(:userName)', {
        userName: `%${filters.userName}%`,
      });
    }

    if (filters.type) {
      qb.andWhere('tx.type = :type', { type: filters.type });
    }

    if (filters.from) {
      qb.andWhere('tx.timestamp >= :from', { from: `${filters.from}T00:00:00.000Z` });
    }

    if (filters.to) {
      qb.andWhere('tx.timestamp <= :to', { to: `${filters.to}T23:59:59.999Z` });
    }

    const [rows, total] = await qb
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();

    return {
      data: rows.map((tx) => ({
        id: tx.id,
        userId: tx.userId,
        userName: tx.user?.name,
        type: tx.type,
        amount: formatMoney(toDecimal(tx.amount)),
        timestamp: tx.timestamp.toISOString(),
        referenceId: tx.referenceId,
        description: tx.description,
      })),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit) || 1,
      },
    };
  }
}

export const transactionService = new TransactionService();
