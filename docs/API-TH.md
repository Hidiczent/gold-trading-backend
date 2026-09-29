# คู่มือ API — Gold Trading (v1)

เอกสารภาษาไทยฉบับเต็ม — โครงสร้างเดียวกับ [API.md](./API.md) (English).

**Base URL:** `http://localhost:3000`  
**Prefix:** `/api/v1`  
**Swagger:** http://localhost:3000/api/docs  
**Postman:** โฟลเดอร์ [`postman/`](../postman/README.md)

---

## 1. แนวทางร่วม

### Authentication

```http
Authorization: Bearer <JWT>
```

Payload: `{ "sub": "<uuid>", "role": "user|admin" }` — role มาจาก server/JWT เท่านั้น

| กรณี | HTTP | Code |
|------|------|------|
| ไม่มี/ token ผิด | 401 | `UNAUTHORIZED` |
| บัญชี inactive | 403 | `USER_INACTIVE` |
| user เรียก admin | 403 | `FORBIDDEN` |

### Response

สำเร็จ: `{ "data": ... }` หรือ `{ "message", "data" }`  
ผิดพลาด: `{ "error": { "code", "message" } }`

### Validation

Zod — ผิด format → `422 VALIDATION_ERROR`  
จำนวนเงิน/ทองส่งเป็น **string ตัวเลข** เช่น `"1000000"`, `"1.5"`

### Rate limit

เข้มที่ auth และ wallet/trades — เกิน → `429 TOO_MANY_REQUESTS`

### การเงิน

Transaction DB + pessimistic lock บน wallet / gold holding

---

## 2. Health & Docs

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | ไม่ |
| GET | `/api/docs` | ไม่ |

---

## 3. Auth — `/api/v1/auth`

### POST `/register`

- Body: `name`, `email`, `password` (กฎ password ตาม Zod)
- สร้าง user + wallet + gold holding + JWT
- 201 / 409 (email ซ้ำ) / 422

### POST `/login`

- Body: `email`, `password`
- 200 + `token`, `user` / 401 / 403 inactive

---

## 4. Wallet — `/api/v1/wallet`

ต้อง Bearer + active

| Method | Path | Body | หมายเหตุ |
|--------|------|------|----------|
| GET | `/` | — | balance, currency |
| POST | `/deposit` | `{ "amount" }` | transaction deposit |
| POST | `/withdraw` | `{ "amount" }` | `INSUFFICIENT_BALANCE` ถ้าไม่พอ |

---

## 5. Gold price — `/api/v1/gold-price`

GET `/` — public — `pricePerGram`, `currency`, `updatedAt`

---

## 6. Gold holdings — `/api/v1/gold-holdings`

GET `/` — `goldAmount`, `unit: gram`

---

## 7. Trades — `/api/v1/trades`

| Method | Path | คำอธิบาย |
|--------|------|----------|
| POST | `/buy` | `{ "goldAmount" }` — หักเงิน เพิ่มทอง |
| POST | `/sell` | `{ "goldAmount" }` — ลดทอง เพิ่มเงิน |
| GET | `/` | query: `page`, `limit`, `type?` |

---

## 8. Transactions — `/api/v1/transactions`

GET `/` — query: `page`, `limit`, `type?`, `from?`, `to?`, `userName?` (admin)

User เห็นเฉพาะของตัวเอง; admin เห็นทั้งหมด

---

## 9. Broadcasts — `/api/v1/broadcasts`

GET `/` — public — รายการประกาศที่ active

---

## 10. Admin — `/api/v1/admin`

ต้อง role **admin**

| Method | Path |
|--------|------|
| GET | `/users` |
| GET | `/transactions` |
| GET | `/trades` |
| POST | `/users/:userId/balance-adjustment` |
| POST | `/users/:userId/deactivate` |
| POST | `/broadcasts` |

Seed: `admin@example.com` / `Admin123!`

---

## 11. ตารางสรุป

ดูตารางเต็มใน [API.md](./API.md#12-endpoint-summary) (English)

---

## 12. รหัส Error

`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `USER_INACTIVE`, `NOT_FOUND`, `CONFLICT`, `INSUFFICIENT_BALANCE`, `INSUFFICIENT_GOLD`, `TOO_MANY_REQUESTS`, `INTERNAL_ERROR`

รายละเอียดแต่ละ endpoint (request/response ตัวอย่าง) ดู **[API.md](./API.md)** เป็นหลัก — ไฟล์นี้เป็นสารบัญภาษาไทยแบบย่อ
