import { Router, type IRouter } from 'express';
import { authController } from './auth.controller';
import { registerSchema, loginSchema } from './auth.schema';
import { validate } from '../../common/middleware/validate.middleware';
import { authRateLimiter } from '../../common/middleware/rate-limit.middleware';

export const authRouter: IRouter = Router();

authRouter.post('/register', authRateLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authRateLimiter, validate(loginSchema), authController.login);
