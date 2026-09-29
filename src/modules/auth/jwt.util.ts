import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UserRole } from '../../common/constants/enums';

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || !decoded.sub || !decoded.role) {
    throw new Error('Invalid token payload');
  }
  return { sub: decoded.sub, role: decoded.role as UserRole };
}
