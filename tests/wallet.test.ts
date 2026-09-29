import { getTestApp, resetDatabase, api, registerUser } from './helpers/test-context';
import type { Express } from 'express';

describe('Wallet', () => {
  let app: Express;
  let token: string;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
    const auth = await registerUser(app, {
      name: 'Wallet User',
      email: 'wallet@example.com',
      password: 'Password123!',
    });
    token = auth.token;
  });

  it('deposits funds', async () => {
    const res = await api(app)
      .post('/api/v1/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '1000000' });

    expect(res.status).toBe(200);
    expect(res.body.data.balance).toBe('1000000');
  });

  it('rejects invalid deposit amount', async () => {
    const res = await api(app)
      .post('/api/v1/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '0' });

    expect(res.status).toBe(422);
  });

  it('withdraws funds', async () => {
    await api(app)
      .post('/api/v1/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '1000000' });

    const res = await api(app)
      .post('/api/v1/wallet/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '500000' });

    expect(res.status).toBe(200);
    expect(res.body.data.balance).toBe('500000');
  });

  it('returns insufficient balance error', async () => {
    await api(app)
      .post('/api/v1/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '100000' });

    const res = await api(app)
      .post('/api/v1/wallet/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '500000' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('prevents negative balance under concurrent withdrawals', async () => {
    await api(app)
      .post('/api/v1/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '1000000' });

    const results = await Promise.all(
      Array.from({ length: 2 }).map(() =>
        api(app)
          .post('/api/v1/wallet/withdraw')
          .set('Authorization', `Bearer ${token}`)
          .send({ amount: '800000' }),
      ),
    );

    const successCount = results.filter((r) => r.status === 200).length;
    const failCount = results.filter((r) => r.status === 400).length;

    expect(successCount).toBe(1);
    expect(failCount).toBe(1);

    const wallet = await api(app)
      .get('/api/v1/wallet')
      .set('Authorization', `Bearer ${token}`);

    expect(wallet.body.data.balance).toBe('200000');
  });
});
