import bcrypt from 'bcrypt';
import { getTestApp, resetDatabase, api, registerUser } from './helpers/test-context';
import type { Express } from 'express';
import { AppDataSource } from '../src/database/data-source';
import { User } from '../src/modules/users/user.entity';
import { UserRole, UserStatus } from '../src/common/constants/enums';
import { signToken } from '../src/modules/auth/jwt.util';

describe('Authorization', () => {
  let app: Express;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('rejects missing JWT', async () => {
    const res = await api(app).get('/api/v1/wallet');
    expect(res.status).toBe(401);
  });

  it('rejects invalid JWT', async () => {
    const res = await api(app)
      .get('/api/v1/wallet')
      .set('Authorization', 'Bearer invalid.token.value');
    expect(res.status).toBe(401);
  });

  it('forbids normal user on admin route', async () => {
    const { token } = await registerUser(app, {
      name: 'User',
      email: 'user@example.com',
      password: 'Password123!',
    });

    const res = await api(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows admin access', async () => {
    const repo = AppDataSource.getRepository(User);
    const hash = await bcrypt.hash('Admin123!', 12);
    const admin = repo.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: hash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    await repo.save(admin);

    const login = await api(app).post('/api/v1/auth/login').send({
      email: 'admin@example.com',
      password: 'Admin123!',
    });

    const res = await api(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${login.body.data.token}`);

    expect(res.status).toBe(200);
  });

  it('rejects inactive user on protected financial route', async () => {
    const { userId, token } = await registerUser(app, {
      name: 'Inactive',
      email: 'inactive2@example.com',
      password: 'Password123!',
    });

    await AppDataSource.getRepository(User).update(userId, {
      status: UserStatus.INACTIVE,
    });

    const res = await api(app)
      .post('/api/v1/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '1000' });

    expect(res.status).toBe(403);
  });

  it('rejects token when role changed server-side mismatch', async () => {
    const { userId } = await registerUser(app, {
      name: 'Role',
      email: 'role@example.com',
      password: 'Password123!',
    });

    const forged = signToken({ sub: userId, role: UserRole.ADMIN });
    const res = await api(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });
});
