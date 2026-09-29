import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../../database/data-source';
import { User } from '../../modules/users/user.entity';
import { UserStatus } from '../constants/enums';
import { AppError, ErrorCodes } from '../errors/app-error';
import { verifyToken } from '../../modules/auth/jwt.util';
import { UserRole } from '../constants/enums';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Authentication required');
    }

    const token = header.slice(7);
    const payload = verifyToken(token);

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'name', 'role', 'status'],
    });

    if (!user) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid token');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(403, ErrorCodes.USER_INACTIVE, 'User account is inactive');
    }

    if (user.role !== payload.role) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid token');
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      status: user.status,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired token'));
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AppError(401, ErrorCodes.UNAUTHORIZED, 'Authentication required'));
    return;
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, ErrorCodes.UNAUTHORIZED, 'Authentication required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError(403, ErrorCodes.FORBIDDEN, 'Insufficient permissions'));
      return;
    }
    next();
  };
}

export function requireActiveUser(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.status !== UserStatus.ACTIVE) {
    next(new AppError(403, ErrorCodes.USER_INACTIVE, 'User account is inactive'));
    return;
  }
  next();
}
