# Gold Trading API Reference (v1)

**Base URL:** `http://localhost:3000`  
**API prefix:** `/api/v1`  
**Interactive docs:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)  
**Postman:** import files from [`postman/`](../postman/README.md)

---

## 1. Conventions

### 1.1 Authentication

Protected routes require:

```http
Authorization: Bearer <JWT>
```

JWT payload after login:

```json
{
  "sub": "<user-uuid>",
  "role": "user | admin"
}
```

The server verifies the token, loads the user from the database, and checks `status === active`. Role is never taken from the request body.

| Situation | HTTP | Code |
|-----------|------|------|
| Missing/invalid token | 401 | `UNAUTHORIZED` |
| Inactive user | 403 | `USER_INACTIVE` |
| Non-admin on admin route | 403 | `FORBIDDEN` |

### 1.2 Response format

**Success**

```json
{ "data": { } }
```

Or with a message:

```json
{ "message": "Operation successful", "data": { } }
```

**Error**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Common status codes: `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.

### 1.3 Validation

Request body, query, and path parameters are validated with **Zod**. Failures return `422` with code `VALIDATION_ERROR`.

Monetary and gold amounts must be sent as **numeric strings** (e.g. `"1000000"`, `"1.5"`), not JSON numbers, to avoid floating-point issues.

### 1.4 Rate limiting

Global limits apply to all routes. Stricter limits apply to:

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- `POST /api/v1/wallet/deposit`, `POST /api/v1/wallet/withdraw`
- `POST /api/v1/trades/buy`, `POST /api/v1/trades/sell`

Exceeded limits return `429` with code `TOO_MANY_REQUESTS`. Limits are configurable via `.env`.

### 1.5 Financial operations

Wallet and gold updates run inside **database transactions** with **pessimistic row locks** on wallet and gold-holding rows to prevent race conditions and negative balances.

---

## 2. Health & documentation

### `GET /health`

| | |
|---|---|
| **Auth** | None |

**200 OK**

```json
{
  "status": "ok",
  "timestamp": "2026-09-29T10:00:00.000Z",
  "database": "connected"
}
```

---

### `GET /api/docs`

| | |
|---|---|
| **Auth** | None |
| **Description** | Swagger UI for this API |

---

## 3. Authentication — `/api/v1/auth`

### `POST /api/v1/auth/register`

| | |
|---|---|
| **Auth** | Public |
| **Rate limit** | Auth (strict) |

**Request body**

| Field | Rules |
|-------|--------|
| `name` | 2–255 characters |
| `email` | Valid email, unique |
| `password` | Min 8 chars; uppercase, lowercase, digit, special character |

**Behavior**

1. Hash password (bcrypt, cost 12)  
2. Create user (`role: user`, `status: active`)  
3. Create wallet (balance `0`, currency `LAK`)  
4. Create gold holding (`0` grams)  
5. Return JWT and user profile (password never returned)

**201 Created**

```json
{
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors:** `409 CONFLICT` (duplicate email), `422 VALIDATION_ERROR`

---

### `POST /api/v1/auth/login`

| | |
|---|---|
| **Auth** | Public |
| **Rate limit** | Auth (strict) |

**Request body**

```json
{
  "email": "user@example.com",
  "password": "User123!"
}
```

**200 OK**

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "name": "Demo User",
      "email": "user@example.com",
      "role": "user",
      "status": "active"
    }
  }
}
```

**Errors:** `401 UNAUTHORIZED` (wrong credentials), `403 USER_INACTIVE`

---

## 4. Wallet — `/api/v1/wallet`

All routes require **Bearer token** and an **active** user.

### `GET /api/v1/wallet`

Returns the authenticated user’s cash balance.

**200 OK**

```json
{
  "data": {
    "balance": "1000000",
    "currency": "LAK"
  }
}
```

---

### `POST /api/v1/wallet/deposit`

| | |
|---|---|
| **Rate limit** | Financial (strict) |

**Request body**

```json
{ "amount": "1000000" }
```

`amount` must be a positive numeric string.

**Behavior:** Lock wallet → increase balance → insert transaction (`type: deposit`).

**200 OK**

```json
{
  "message": "Deposit successful",
  "data": {
    "balance": "1000000",
    "currency": "LAK"
  }
}
```

---

### `POST /api/v1/wallet/withdraw`

**Request body**

```json
{ "amount": "500000" }
```

**Behavior:** Lock wallet → verify sufficient balance → decrease balance → transaction (`type: withdraw`).

**400 Bad Request**

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient wallet balance"
  }
}
```

---

## 5. Gold price — `/api/v1/gold-price`

### `GET /api/v1/gold-price`

| | |
|---|---|
| **Auth** | None (public) |

**200 OK**

```json
{
  "data": {
    "pricePerGram": "5000000",
    "currency": "LAK",
    "updatedAt": "2026-09-29T10:00:00.000Z"
  }
}
```

In development, price may be simulated and updated periodically. **Buy/sell** always snapshot the price at execution time in the `trades` table.

---

## 6. Gold holdings — `/api/v1/gold-holdings`

### `GET /api/v1/gold-holdings`

| | |
|---|---|
| **Auth** | Bearer token required |

**200 OK**

```json
{
  "data": {
    "goldAmount": "2.5000",
    "unit": "gram"
  }
}
```

---

## 7. Trades — `/api/v1/trades`

Requires **Bearer token** and **active** user. Buy/sell use financial rate limits.

### `POST /api/v1/trades/buy`

**Request body**

```json
{ "goldAmount": "1.5" }
```

**Calculation:** `totalCost = goldAmount × currentPricePerGram`

**Atomic flow**

1. Read current gold price  
2. Lock wallet → check balance → deduct LAK  
3. Lock gold holding → add grams  
4. Create trade record (`type: buy`, stores `price_per_gram`, `total_cost`)  
5. Create transaction (`type: trade`, links `reference_id` to trade)

**200 OK:** `{ "message": "Buy trade successful" }`  
**400:** `INSUFFICIENT_BALANCE`

---

### `POST /api/v1/trades/sell`

**Request body**

```json
{ "goldAmount": "0.5" }
```

**Atomic flow:** Lock holding → verify gold → reduce gold → lock wallet → credit LAK → trade + transaction.

**400 Bad Request**

```json
{
  "error": {
    "code": "INSUFFICIENT_GOLD",
    "message": "Insufficient gold balance"
  }
}
```

---

### `GET /api/v1/trades`

Trade history for the **authenticated user only**.

**Query parameters**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | `1` | Page number (≥ 1) |
| `limit` | `20` | Page size (1–100) |
| `type` | — | Optional: `buy` or `sell` |

**200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "buy",
      "goldAmount": "1.5000",
      "pricePerGram": "5000000",
      "totalCost": "7500000",
      "timestamp": "2026-09-29T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 8. Transactions — `/api/v1/transactions`

### `GET /api/v1/transactions`

| | |
|---|---|
| **Auth** | Bearer token |

- **Regular users:** only their own transactions.  
- **Admins:** all users; may filter by `userName`.

**Query parameters**

| Parameter | Description |
|-----------|-------------|
| `page`, `limit` | Pagination |
| `type` | `deposit`, `withdraw`, or `trade` |
| `from`, `to` | Date range (`YYYY-MM-DD`) on `timestamp` |
| `userName` | Admin only — partial match on user name |

**200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "Demo User",
      "type": "deposit",
      "amount": "1000000",
      "timestamp": "2026-09-29T10:00:00.000Z",
      "referenceId": null,
      "description": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

---

## 9. Broadcasts — `/api/v1/broadcasts`

### `GET /api/v1/broadcasts`

| | |
|---|---|
| **Auth** | None |

Returns active broadcasts (not expired).

**200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Maintenance notice",
      "message": "System maintenance tonight",
      "createdAt": "2026-09-29T10:00:00.000Z",
      "expiresAt": null
    }
  ]
}
```

---

## 10. Admin — `/api/v1/admin`

All routes require **Bearer token** and **`role: admin`**.

Development seed credentials (not for production):

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `Admin123!` | admin |
| `user@example.com` | `User123!` | user |

---

### `GET /api/v1/admin/users`

Paginated list of users with wallet balance and gold holding.

**Query:** `page`, `limit`

**200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Demo User",
      "email": "user@example.com",
      "role": "user",
      "status": "active",
      "walletBalance": "1000000",
      "goldHolding": "1.5000",
      "createdAt": "2026-09-29T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
}
```

---

### `GET /api/v1/admin/transactions`

All transactions with admin filters.

**Query:** `page`, `limit`, `userName`, `type`, `from`, `to`

Response shape matches `GET /api/v1/transactions`.

---

### `GET /api/v1/admin/trades`

All trades across users.

**Query:** `page`, `limit`, `userName`, `type` (`buy` | `sell`)

**200 OK** — items include `userName` where available.

---

### `POST /api/v1/admin/users/:userId/balance-adjustment`

Manual wallet correction.

**Path:** `userId` — UUID

**Request body**

```json
{
  "amount": "100000",
  "reason": "Manual correction"
}
```

- `amount`: signed numeric string (`+` increases, `-` decreases; balance cannot go negative)  
- Creates a `deposit` or `withdraw` transaction with description including admin id and reason

**200 OK:** `{ "message": "Balance adjusted successfully" }`

---

### `POST /api/v1/admin/users/:userId/deactivate`

Soft-deactivates a user (`status: inactive`, `deleted_at` set). Historical data remains. User cannot log in or perform financial operations.

**200 OK:** `{ "message": "User deactivated successfully" }`

---

### `POST /api/v1/admin/broadcasts`

Create a system-wide broadcast.

**Request body**

```json
{
  "title": "Maintenance notice",
  "message": "System maintenance 22:00–23:00",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

`expiresAt` is optional (ISO 8601 datetime).

**201 Created:** `{ "data": { ...broadcast } }`

---

## 11. Recommended test flow

```
GET  /health
POST /api/v1/auth/login          (user)
GET  /api/v1/wallet
POST /api/v1/wallet/deposit
GET  /api/v1/gold-price
POST /api/v1/trades/buy
GET  /api/v1/gold-holdings
POST /api/v1/trades/sell
GET  /api/v1/transactions
GET  /api/v1/trades
POST /api/v1/auth/login          (admin)
GET  /api/v1/admin/users
GET  /api/v1/admin/transactions
GET  /api/v1/admin/trades
```

---

## 12. Endpoint summary

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/health` | No | Public |
| GET | `/api/docs` | No | Public |
| POST | `/api/v1/auth/register` | No | Public |
| POST | `/api/v1/auth/login` | No | Public |
| GET | `/api/v1/wallet` | Yes | User (active) |
| POST | `/api/v1/wallet/deposit` | Yes | User (active) |
| POST | `/api/v1/wallet/withdraw` | Yes | User (active) |
| GET | `/api/v1/gold-price` | No | Public |
| GET | `/api/v1/gold-holdings` | Yes | User |
| POST | `/api/v1/trades/buy` | Yes | User (active) |
| POST | `/api/v1/trades/sell` | Yes | User (active) |
| GET | `/api/v1/trades` | Yes | User |
| GET | `/api/v1/transactions` | Yes | User / Admin* |
| GET | `/api/v1/broadcasts` | No | Public |
| GET | `/api/v1/admin/users` | Yes | Admin |
| GET | `/api/v1/admin/transactions` | Yes | Admin |
| GET | `/api/v1/admin/trades` | Yes | Admin |
| POST | `/api/v1/admin/users/:userId/balance-adjustment` | Yes | Admin |
| POST | `/api/v1/admin/users/:userId/deactivate` | Yes | Admin |
| POST | `/api/v1/admin/broadcasts` | Yes | Admin |

\* On `GET /transactions`, admins see all users and may use `userName`; regular users see only their own rows.

---

## 13. Error codes reference

| Code | Typical HTTP | Meaning |
|------|--------------|---------|
| `VALIDATION_ERROR` | 422 | Invalid input |
| `UNAUTHORIZED` | 401 | Missing/invalid JWT |
| `FORBIDDEN` | 403 | Insufficient role |
| `USER_INACTIVE` | 403 | Account deactivated |
| `NOT_FOUND` | 404 | Resource missing |
| `CONFLICT` | 409 | e.g. duplicate email |
| `INSUFFICIENT_BALANCE` | 400 | Wallet too low |
| `INSUFFICIENT_GOLD` | 400 | Not enough gold to sell |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Server error |
