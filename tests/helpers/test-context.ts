import 'reflect-metadata';
import request from 'supertest';
import { AppDataSource } from '../../src/database/data-source';
import { createApp } from '../../src/app';
import type { Express } from 'express';

let initialized = false;

export async function getTestApp(): Promise<Express> {
  if (!initialized) {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    initialized = true;
  }
  return createApp();
}

export async function resetDatabase(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
  }
  await AppDataSource.query(
    'TRUNCATE TABLE broadcasts, trades, transactions, gold_holdings, wallets, users RESTART IDENTITY CASCADE',
  );
}

export function api(app: Express) {
  return request(app);
}

export async function registerUser(
  app: Express,
  payload: { name: string; email: string; password: string },
): Promise<{ token: string; userId: string }> {
  const res = await api(app).post('/api/v1/auth/register').send(payload);
  return {
    token: res.body.data.token as string,
    userId: res.body.data.user.id as string,
  };
}
