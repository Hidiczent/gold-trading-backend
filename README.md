# Gold Trading Backend

Production-oriented Node.js/TypeScript API for user accounts, LAK wallets, gold holdings, and buy/sell trades with admin oversight.

## Features

- Email/password auth with JWT (payload includes `sub` and `role`)
- Wallet deposit/withdraw with transaction history
- Gold buy/sell using a pluggable gold price provider
- Admin user/transaction/trade views, balance adjustments, soft deactivation
- Pagination, filtering, rate limiting, RBAC, OpenAPI docs

## Architecture

Modular Express app under `src/modules/*` with thin controllers and service-layer business logic. PostgreSQL persistence via TypeORM entities and explicit migrations (`synchronize: false`).

## Technology Stack

Node.js 20, **pnpm 9**, TypeScript (strict), Express, PostgreSQL, TypeORM, JWT, bcrypt, Zod, Helmet, CORS, express-rate-limit, Jest, Supertest, Swagger UI, Docker Compose.

## Database Design

| Table | Purpose |
| --- | --- |
| `users` | Identity, role, status, soft delete |
| `wallets` | Cash balance (`NUMERIC(20,8)`), currency (default `LAK`) |
| `gold_holdings` | Gold grams per user |
| `transactions` | `deposit`, `withdraw`, `trade` audit trail |
| `trades` | Immutable buy/sell records with price snapshot |
| `broadcasts` | Optional admin announcements (bonus) |

## Relationships

`User` → one `Wallet`, one `GoldHolding`, many `Transactions`, many `Trades`.

## Financial Precision Strategy

All monetary and gold values use PostgreSQL `NUMERIC(20,8)`. Application calculations use `decimal.js`; API responses format money as integer LAK strings and gold to 4 decimal grams. Historical trades store `price_per_gram` and `total_cost` at execution time.

## Transaction & Concurrency Strategy

Financial mutations run inside TypeORM transactions with `SELECT … FOR UPDATE` (`pessimistic_write` locks) on wallet and gold holding rows. PostgreSQL `CHECK (balance >= 0)` and `CHECK (gold_amount >= 0)` provide a second line of defense.

## Security Decisions

- bcrypt (cost 12) for passwords; hashes never returned in API responses
- JWT secret from environment; role taken from verified token + DB user, never request body
- Zod validation on body/query/params; TypeORM parameterized queries
- Helmet, configurable CORS, tiered rate limits (auth vs financial)
- Centralized error handler; no stack traces in production

## Installation

```bash
cp .env.example .env
corepack enable
pnpm install
pnpm run migration:run
pnpm run seed
pnpm dev
```

## Docker Setup

```bash
docker compose up --build
```

Postgres is published on host port **5433** (not 5432) so it does not clash with other local databases. For `pnpm dev` on your machine, use `DATABASE_HOST=localhost` and `DATABASE_PORT=5433` in `.env`.

Services: `backend` (port 3000), `postgres` (5432). Migrations run on container start.

## Environment Variables

See [.env.example](.env.example) for `DATABASE_*`, `JWT_*`, `GOLD_PRICE_PER_GRAM`, and rate limit settings.

## Migration & Seed

```bash
pnpm run migration:run
pnpm run migration:revert
pnpm run seed
```

**Development credentials only (from seed):**

| Email | Password | Role |
| --- | --- | --- |
| admin@example.com | Admin123! | admin |
| user@example.com | User123! | user |

## Tests

Requires PostgreSQL (creates `gold_trading_test` if missing):

```bash
pnpm test
pnpm run test:coverage
```

## Swagger

OpenAPI UI: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## Postman

Import collection และ environment จากโฟลเดอร์ [`postman/`](postman/README.md) — มี script เก็บ JWT หลัง login อัตโนมัติ

## API documentation

| Language | File |
| --- | --- |
| English (full) | [docs/API.md](docs/API.md) |
| Thai (summary + links) | [docs/API-TH.md](docs/API-TH.md) |

## Authentication Flow

1. `POST /api/v1/auth/register` or login
2. Send `Authorization: Bearer <token>` on protected routes
3. Middleware verifies JWT, loads user, rejects inactive accounts

## Authorization

- `requireAuth()` — authenticated active user
- `requireRole('admin')` — admin-only routes under `/api/v1/admin/*`

## API Endpoints

| Method | Endpoint | Authentication | Role |
| --- | --- | --- | --- |
| POST | /api/v1/auth/register | No | Public |
| POST | /api/v1/auth/login | No | Public |
| GET | /api/v1/wallet | Yes | User |
| POST | /api/v1/wallet/deposit | Yes | User |
| POST | /api/v1/wallet/withdraw | Yes | User |
| GET | /api/v1/gold-price | No | Public |
| GET | /api/v1/gold-holdings | Yes | User |
| POST | /api/v1/trades/buy | Yes | User |
| POST | /api/v1/trades/sell | Yes | User |
| GET | /api/v1/trades | Yes | User |
| GET | /api/v1/transactions | Yes | User |
| GET | /api/v1/broadcasts | No | Public |
| GET | /api/v1/admin/users | Yes | Admin |
| GET | /api/v1/admin/transactions | Yes | Admin |
| GET | /api/v1/admin/trades | Yes | Admin |
| POST | /api/v1/admin/users/:userId/balance-adjustment | Yes | Admin |
| POST | /api/v1/admin/users/:userId/deactivate | Yes | Admin |
| POST | /api/v1/admin/broadcasts | Yes | Admin |
| GET | /health | No | Public |

## Bonus Features

1. **Simulated gold price** — In development, price updates every 30s via `SimulatedGoldPriceProvider`.
2. **Admin broadcasts** — `POST /api/v1/admin/broadcasts`, public `GET /api/v1/broadcasts`.
3. **Multi-currency readiness** — `wallets.currency` defaults to `LAK`; architecture allows additional currencies without breaking LAK flows.

## Known Limitations

- Gold price in production defaults to env-based static provider until an external feed is wired in.
- Soft delete is exposed via admin deactivate endpoint (not self-service).
- Docker was not verified in this environment when the daemon was unavailable; run `docker compose up --build` locally to confirm.
