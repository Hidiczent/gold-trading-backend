import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { entities } from './entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  synchronize: false,
  logging: env.NODE_ENV === 'development',
  entities,
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
