import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

describe('Rate limiting', () => {
  it('returns 429 after exceeding limit', async () => {
    const app = express();
    const limiter = rateLimit({
      windowMs: 60_000,
      max: 2,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({
          error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests' },
        });
      },
    });

    app.post('/limited', limiter, (_req, res) => {
      res.status(200).json({ ok: true });
    });

    await request(app).post('/limited').expect(200);
    await request(app).post('/limited').expect(200);
    const res = await request(app).post('/limited');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
