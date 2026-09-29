import { getTestApp, resetDatabase, api, registerUser } from './helpers/test-context';
import type { Express } from 'express';

describe('Trading', () => {
  let app: Express;
  let token: string;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
    const auth = await registerUser(app, {
      name: 'Trader',
      email: 'trader@example.com',
      password: 'Password123!',
    });
    token = auth.token;

    await api(app)
      .post('/api/v1/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '20000000' });
  });

  it('buys gold', async () => {
    const res = await api(app)
      .post('/api/v1/trades/buy')
      .set('Authorization', `Bearer ${token}`)
      .send({ goldAmount: '1.5' });

    expect(res.status).toBe(200);

    const holding = await api(app)
      .get('/api/v1/gold-holdings')
      .set('Authorization', `Bearer ${token}`);

    expect(holding.body.data.goldAmount).toBe('1.5000');
  });

  it('rejects buy with insufficient balance', async () => {
    const res = await api(app)
      .post('/api/v1/trades/buy')
      .set('Authorization', `Bearer ${token}`)
      .send({ goldAmount: '100' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('sells gold', async () => {
    await api(app)
      .post('/api/v1/trades/buy')
      .set('Authorization', `Bearer ${token}`)
      .send({ goldAmount: '2' });

    const res = await api(app)
      .post('/api/v1/trades/sell')
      .set('Authorization', `Bearer ${token}`)
      .send({ goldAmount: '0.5' });

    expect(res.status).toBe(200);

    const holding = await api(app)
      .get('/api/v1/gold-holdings')
      .set('Authorization', `Bearer ${token}`);

    expect(holding.body.data.goldAmount).toBe('1.5000');
  });

  it('rejects sell with insufficient gold', async () => {
    const res = await api(app)
      .post('/api/v1/trades/sell')
      .set('Authorization', `Bearer ${token}`)
      .send({ goldAmount: '1' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_GOLD');
  });
});
