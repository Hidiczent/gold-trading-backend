import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password } = req.body as {
        name: string;
        email: string;
        password: string;
      };
      const result = await authService.register(name, email, password);
      res.status(201).json({
        message: 'Registration successful',
        data: {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            status: result.user.status,
          },
          token: result.token,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await authService.login(email, password);
      res.status(200).json({
        data: {
          token: result.token,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            status: result.user.status,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
