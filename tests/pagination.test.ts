import { getTestApp, resetDatabase, api, registerUser } from './helpers/test-context';
import type { Express } from 'express';

describe('Pagination', () => {
  let app: Express;
  let token: string;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
    const auth = await registerUser(app, {
      name: 'Pager',
      email: 'pager@example.com',
      password: 'Password123!',
    });
    token = auth.token;

    for (let i = 0; i < 3; i += 1) {
      await api(app)
        .post('/api/v1/wallet/deposit')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: '1000' });
    }
  });

  it('returns pagination metadata', async () => {
    const res = await api(app)
      .get('/api/v1/transactions?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.pagination.totalPages).toBe(2);
    expect(res.body.data).toHaveLength(2);
  });
});
