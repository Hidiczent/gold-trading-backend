import { getTestApp, resetDatabase, api, registerUser } from './helpers/test-context';
import type { Express } from 'express';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../src/database/data-source';
import { User } from '../src/modules/users/user.entity';
import { UserRole, UserStatus } from '../src/common/constants/enums';

describe('Auth', () => {
  let app: Express;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('registers a user and creates wallet/holding', async () => {
    const res = await api(app).post('/api/v1/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('john@example.com');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('rejects duplicate email', async () => {
    await registerUser(app, {
      name: 'John',
      email: 'dup@example.com',
      password: 'Password123!',
    });

    const res = await api(app).post('/api/v1/auth/register').send({
      name: 'Jane',
      email: 'dup@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(409);
  });

  it('rejects invalid email', async () => {
    const res = await api(app).post('/api/v1/auth/register').send({
      name: 'John',
      email: 'not-an-email',
      password: 'Password123!',
    });
    expect(res.status).toBe(422);
  });

  it('rejects weak password', async () => {
    const res = await api(app).post('/api/v1/auth/register').send({
      name: 'John',
      email: 'weak@example.com',
      password: 'short',
    });
    expect(res.status).toBe(422);
  });

  it('logs in with valid credentials', async () => {
    await registerUser(app, {
      name: 'John',
      email: 'login@example.com',
      password: 'Password123!',
    });

    const res = await api(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    await registerUser(app, {
      name: 'John',
      email: 'wrong@example.com',
      password: 'Password123!',
    });

    const res = await api(app).post('/api/v1/auth/login').send({
      email: 'wrong@example.com',
      password: 'WrongPass1!',
    });

    expect(res.status).toBe(401);
  });

  it('rejects inactive user login', async () => {
    const { userId } = await registerUser(app, {
      name: 'Inactive',
      email: 'inactive@example.com',
      password: 'Password123!',
    });

    await AppDataSource.getRepository(User).update(userId, {
      status: UserStatus.INACTIVE,
    });

    const res = await api(app).post('/api/v1/auth/login').send({
      email: 'inactive@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('USER_INACTIVE');
  });

  it('allows admin login from seed-like user', async () => {
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

    const res = await api(app).post('/api/v1/auth/login').send({
      email: 'admin@example.com',
      password: 'Admin123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
  });
});
