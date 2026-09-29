import bcrypt from 'bcrypt';
import { AppDataSource } from '../../database/data-source';
import { User } from '../users/user.entity';
import { Wallet } from '../wallets/wallet.entity';
import { GoldHolding } from '../trades/gold-holding.entity';
import { UserRole, UserStatus } from '../../common/constants/enums';
import { AppError, ErrorCodes } from '../../common/errors/app-error';
import { signToken } from './jwt.util';
import { logger } from '../../config/logger';

export class AuthService {
  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const userRepo = AppDataSource.getRepository(User);

    const existing = await userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    return AppDataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        name,
        email: email.toLowerCase(),
        password: passwordHash,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
      await manager.save(user);

      await manager.save(
        manager.create(Wallet, { userId: user.id, balance: '0', currency: 'LAK' }),
      );
      await manager.save(manager.create(GoldHolding, { userId: user.id, goldAmount: '0' }));

      const token = signToken({ sub: user.id, role: user.role });
      logger.info('User registered', { userId: user.id, email: user.email });

      const { password: _pw, ...safeUser } = user;
      void _pw;
      return { user: safeUser as User, token };
    });
  }

  async login(email: string, password: string): Promise<{ token: string; user: Omit<User, 'password'> }> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();

    if (!user) {
      logger.warn('Login failed', { email, reason: 'user_not_found' });
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      logger.warn('Login rejected inactive user', { userId: user.id });
      throw new AppError(403, ErrorCodes.USER_INACTIVE, 'User account is inactive');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logger.warn('Login failed', { email, reason: 'invalid_password' });
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    const token = signToken({ sub: user.id, role: user.role });
    logger.info('User logged in', { userId: user.id });

    const { password: _pw, ...safeUser } = user;
    void _pw;
    return { token, user: safeUser };
  }
}

export const authService = new AuthService();
