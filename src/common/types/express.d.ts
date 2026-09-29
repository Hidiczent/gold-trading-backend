import { UserRole } from '../constants/enums';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
