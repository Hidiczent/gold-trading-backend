import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Gold Trading System API',
      version: '1.0.0',
      description: 'Production-oriented gold trading backend API',
    },
    servers: [{ url: `http://localhost:${env.PORT}`, description: 'Local' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          security: [],
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/v1/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register user',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Created' }, 409: { description: 'Conflict' } },
        },
      },
      '/api/v1/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          security: [],
          responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/v1/wallet': {
        get: { tags: ['Wallet'], summary: 'Get wallet balance', responses: { 200: { description: 'OK' } } },
      },
      '/api/v1/wallet/deposit': {
        post: { tags: ['Wallet'], summary: 'Deposit funds', responses: { 200: { description: 'OK' } } },
      },
      '/api/v1/wallet/withdraw': {
        post: { tags: ['Wallet'], summary: 'Withdraw funds', responses: { 200: { description: 'OK' } } },
      },
      '/api/v1/gold-price': {
        get: {
          tags: ['Gold Price'],
          summary: 'Current gold price',
          security: [],
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/v1/gold-holdings': {
        get: { tags: ['Gold'], summary: 'Get gold holding', responses: { 200: { description: 'OK' } } },
      },
      '/api/v1/trades/buy': {
        post: { tags: ['Trades'], summary: 'Buy gold', responses: { 200: { description: 'OK' } } },
      },
      '/api/v1/trades/sell': {
        post: { tags: ['Trades'], summary: 'Sell gold', responses: { 200: { description: 'OK' } } },
      },
      '/api/v1/trades': {
        get: { tags: ['Trades'], summary: 'List trades', responses: { 200: { description: 'OK' } } },
      },
      '/api/v1/transactions': {
        get: { tags: ['Transactions'], summary: 'List transactions', responses: { 200: { description: 'OK' } } },
      },
      '/api/v1/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'List users',
          responses: { 200: { description: 'OK' }, 403: { description: 'Forbidden' } },
        },
      },
      '/api/v1/admin/transactions': {
        get: { tags: ['Admin'], summary: 'List all transactions', responses: { 200: { description: 'OK' } } },
      },
      '/api/v1/admin/trades': {
        get: { tags: ['Admin'], summary: 'List all trades', responses: { 200: { description: 'OK' } } },
      },
      '/api/v1/admin/users/{userId}/balance-adjustment': {
        post: { tags: ['Admin'], summary: 'Adjust user balance', responses: { 200: { description: 'OK' } } },
      },
      '/api/v1/admin/broadcasts': {
        post: { tags: ['Admin'], summary: 'Create broadcast', responses: { 201: { description: 'Created' } } },
      },
      '/api/v1/broadcasts': {
        get: {
          tags: ['Broadcasts'],
          summary: 'List active broadcasts',
          security: [],
          responses: { 200: { description: 'OK' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
