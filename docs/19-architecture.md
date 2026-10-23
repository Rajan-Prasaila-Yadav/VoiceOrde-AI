# 🏗️ Architecture & Tech Stack

> The browser talks to one order engine, which calls Gnani Prisma for speech, an LLM for extraction and Gnani Timbre for audio, and reads and writes everything that matters in PostgreSQL. Keep it as **one app and one database; no microservices**.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| **Frontend** | Next.js, TypeScript, Tailwind CSS, mobile-first |
| **Backend** | Next.js server routes (a separate Node API only if needed) |
| **Database** | PostgreSQL, for example hosted on Supabase |
| **Speech to text** | Gnani Prisma, behind a small adapter |
| **Text to speech** | Gnani Timbre, behind a small adapter |
| **Item extraction** | An LLM that returns strict JSON, validated before use |
| **Hosting** | Vercel for the app, managed PostgreSQL |
| **Testing** | Vitest for logic, Playwright for the end-to-end order flow |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Next.js)                        │
│  ┌────────────────┐         ┌──────────────────────┐        │
│  │ Customer Pages  │         │ Shopkeeper Dashboard  │        │
│  │ • Shop home     │         │ • Orders & filters    │        │
│  │ • Voice capture │         │ • Record order        │        │
│  │ • Order review  │         │ • Catalogue import    │        │
│  │ • Delivery      │         │ • Customers           │        │
│  │ • Confirm       │         │ • Settings            │        │
│  │ • Tracking      │         │ • Reports             │        │
│  └────────────────┘         └──────────────────────┘        │
└──────────────────────────┬──────────────────────────────────┘
                           │ API calls
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  SERVER (Next.js Routes)                      │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │              Order Engine (shared)                 │       │
│  │  • Catalogue matching  • Quote calculation         │       │
│  │  • Validation          • Idempotent order creation │       │
│  │  • Status transitions  • Payment tracking          │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Prisma       │  │ LLM          │  │ Timbre       │       │
│  │ Adapter      │  │ Adapter      │  │ Adapter      │       │
│  │ (STT)        │  │ (Extraction) │  │ (TTS)        │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          ▼                 ▼                 ▼
   Gnani Prisma API    LLM API         Gnani Timbre API

          │
          ▼
┌──────────────────┐
│   PostgreSQL     │
│   (Supabase)     │
│                  │
│  shops           │
│  products        │
│  customers       │
│  orders          │
│  order_items     │
│  ...             │
└──────────────────┘
```

---

## Main Database Tables

| Table | Key Fields |
|-------|-----------|
| **shops** | id, slug, name, phone, address, currency (INR), delivery fee policy, serviceable pincodes, supported languages |
| **users** | id, auth_subject, name, phone |
| **shop_users** | shop_id, user_id, role (owner/shopkeeper) |
| **products** | id, shop_id, sku, name, aliases[], category, base_unit, pack_size, **price_paise** (integer), stock_quantity, is_published |
| **customers** | id, shop_id, name, phone |
| **customer_addresses** | id, customer_id, address_line1, locality, city, state, pincode, landmark, instructions |
| **orders** | id, shop_id, customer_id, order_number, source, status, **subtotal_paise**, **delivery_fee_paise**, **total_paise**, customer_name_snapshot, address_snapshot, confirmation_method, confirmed_at |
| **order_items** | id, order_id, product_id, product_name_snapshot, quantity, unit_snapshot, **unit_price_paise**, **line_total_paise** |
| **order_status_events** | id, order_id, actor_user_id, from_status, to_status, note, created_at |
| **deliveries** | id, order_id, status, assigned_to, dispatched_at, delivered_at |
| **catalogue_imports** | id, shop_id, uploaded_by, status, rows_total, rows_valid, rows_invalid, error_report |
| **idempotency_records** | id, shop_id, idempotency_key, request_hash, response_body |

### Key Design Decisions

- **Money is stored as integer paise** (₹72.00 → 7200 paise), never as floating-point
- **Snapshots**: Orders store a copy of product name, price, unit, and address at order time. Later changes never alter historical orders
- **Shop scoping**: Every query is scoped to `shop_id` — even with one shop, this prevents redesign later
- **Idempotency**: Duplicate order creation with the same key returns the same result
- **Append-only events**: Status changes are logged, never rewritten

---

*[← Features & Scope](./18-features-and-scope.md) | [Safety & Validation →](./20-safety-and-validation.md)*
