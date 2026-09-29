# ทดสอบด้วย Postman

## Import

1. เปิด Postman → **Import**
2. เลือกไฟล์:
   - `Gold-Trading-API.postman_collection.json`
   - `Gold-Trading-Local.postman_environment.json`
3. เลือก environment **Gold Trading — Local** (มุมขวาบน)

## ก่อนทดสอบ

- รัน `pnpm dev` และ Postgres (`docker compose up -d postgres`)
- รัน seed แล้ว: `pnpm run seed`

## ลำดับแนะนำ

| ลำดับ | Request | หมายเหตุ |
| --- | --- | --- |
| 1 | Health → GET /health | ไม่ต้อง auth |
| 2 | Auth → Login User (seed) | เก็บ `token` + `userId` อัตโนมัติ |
| 3 | Wallet → Deposit | ใส่เงินก่อนซื้อทอง |
| 4 | Gold Price → GET | ราคาต่อกรัม |
| 5 | Trades → Buy gold | 1.5g × ราคา |
| 6 | Gold Holdings → GET | ดูทองคงเหลือ |
| 7 | Trades → Sell gold | |
| 8 | Transactions / Trades → List | |
| 9 | Auth → Login Admin | เก็บ `adminToken` |
| 10 | Admin → * | ใช้ Bearer `adminToken` |

## Auth ใน Postman

- Collection ตั้ง **Bearer Token** = `{{token}}` ให้โฟลเดอร์ User
- โฟลเดอร์ **Admin** ใช้ `{{adminToken}}` แยก
- หรือตั้งเอง: Authorization → Type **Bearer Token** → `{{token}}`

## บัญชี seed (dev เท่านั้น)

| Email | Password | Role |
| --- | --- | --- |
| user@example.com | User123! | user |
| admin@example.com | Admin123! | admin |

## ตัวอย่าง body

**Deposit / Withdraw**

```json
{ "amount": "1000000" }
```

**Buy / Sell**

```json
{ "goldAmount": "1.5" }
```

**Balance adjustment (admin)**

```json
{
  "amount": "100000",
  "reason": "Manual correction"
}
```

`amount` เป็นสตริngตัวเลข (ไม่ใช้ float ใน JSON ถ้า avoid precision — ระบบรับ string)

## Swagger

http://localhost:3000/api/docs
