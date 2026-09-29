import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/user.entity';
import { Wallet } from '../../modules/wallets/wallet.entity';
import { GoldHolding } from '../../modules/trades/gold-holding.entity';
import { UserRole, UserStatus } from '../../common/constants/enums';
import { logger } from '../../config/logger';

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const walletRepo = AppDataSource.getRepository(Wallet);
  const holdingRepo = AppDataSource.getRepository(GoldHolding);

  const seeds = [
    {
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'Admin123!',
      role: UserRole.ADMIN,
    },
    {
      name: 'Demo User',
      email: 'user@example.com',
      password: 'User123!',
      role: UserRole.USER,
    },
  ];

  for (const item of seeds) {
    const existing = await userRepo.findOne({ where: { email: item.email } });
    if (existing) {
      logger.info('Seed skipped, user exists', { email: item.email });
      continue;
    }

    const passwordHash = await bcrypt.hash(item.password, 12);
    const user = userRepo.create({
      name: item.name,
      email: item.email,
      password: passwordHash,
      role: item.role,
      status: UserStatus.ACTIVE,
    });
    await userRepo.save(user);

    await walletRepo.save(
      walletRepo.create({
        userId: user.id,
        balance: '0',
        currency: 'LAK',
      }),
    );

    await holdingRepo.save(
      holdingRepo.create({
        userId: user.id,
        goldAmount: '0',
      }),
    );

    logger.info('Seed user created', { email: item.email, role: item.role });
  }

  await AppDataSource.destroy();
}

seed().catch((error: unknown) => {
  logger.error('Seed failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
