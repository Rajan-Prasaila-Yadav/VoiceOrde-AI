# VoiceOrder AI — Kirana Spoken Grocery Desk 🎙️🛒

> Built for **The Great Indian AI Internship Challenge** by **Gnani AI**  
> *Turning spoken Indian grocery orders (Hindi, Hinglish, regional dialects) into structured, verified digital orders with automated real-time stock deduction.*

---

## 🌟 Executive Summary

In India's neighbourhood retail ecosystem, Kirana store owners receive hundreds of spoken and conversational orders daily (*"दो किलो आटा, एक पैकेट अमूल बटर और एक किलो चीनी चाहिए"*). Manual entry is slow, prone to errors, and disconnects physical shelves from digital stock records.

**VoiceOrder AI** bridges this gap:
1. **Voice-to-Order Desk**: Captures Hindi/Hinglish spoken audio, streams to Gnani AI STT (Prisma), extracts SKU quantities via Evon LLM NLP, and matches items against the live store inventory.
2. **Instant Stock Verification & Deduction**: Verifies real-time shelf availability, flags out-of-stock items, calculates bill with MRP savings, and deducts inventory instantly upon order confirmation.
3. **Mobile-First Native PWA**: Optimized for shopkeeper smartphones with bottom navigation, installable app icons, tap-to-refresh, zero horizontal scrolling, and touch-friendly controls.
4. **Single-Deployment Architecture**: Next.js App Router hosting both the high-performance UI and serverless backend API routes (`/api/...`) under a unified Vercel deployment.

---

## 📱 Mobile-First Native Experience & PWA

VoiceOrder AI is engineered to feel like an installed mobile application rather than a regular website:
- **Zero Horizontal Scroll**: Strictly bounded viewport (`overflow-x: hidden`, flexible grids, and mobile card views replacing unwieldy tables on small screens).
- **Bottom Navigation Bar**: 4 quick-access tabs (`Voice Desk`, `Catalogue`, `Orders`, `Admin`) with safe-area inset support on iOS and Android.
- **Installable PWA**: Includes high-resolution app icons (`192x192`, `512x512`, `apple-touch-icon`), manifest metadata, and one-tap install prompts.
- **Tap-to-Refresh & Re-sync**: Floating action button that re-syncs state with Supabase in real-time.

---

## 🚀 Single-Deployment on Vercel (No Separate Backend Needed)

This project is structured for **Single-Deployment** on Vercel. Both the web application and all backend REST APIs run together as serverless functions:

| API Endpoint | Purpose |
|---|---|
| `GET /api/products` | Fetch filtered catalogue items with inventory status |
| `POST /api/products` | Add new product SKU with voice aliases |
| `GET /api/products/[id]` | Get detailed product spec, margins, and deduction history |
| `PUT /api/products/[id]` | Update selling price, MRP, and stock |
| `DELETE /api/products/[id]` | Remove product from store |
| `POST /api/products/[id]/sold` | Quick sell (-1 unit) and stock deduction |
| `POST /api/products/[id]/restock` | Quick restock (+10 units) |
| `GET /api/orders` | Fetch orders feed with speech transcripts & payment modes |
| `POST /api/orders` | Place verified order and atomic stock decrement |
| `POST /api/gnani/extract` | Parse Hindi/Hinglish speech transcripts into SKU items |
| `POST /api/gnani/stt` | Reverse-proxy speech audio to Gnani Prisma STT |
| `POST /api/auth/login` | Store owner & admin authentication |

---

## ⚙️ Vercel Environment Variables

When importing this repository into [Vercel](https://vercel.com), add the following environment variables in **Project Settings → Environment Variables**:

| Variable Name | Required | Example / Production Value | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | `https://wbkyektreqlpylbclvic.supabase.co` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | `eyJhbGciOiJIUzI1NiIsInR5cCI...` | Supabase Public Anonymous Key |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `https://your-vercel-domain.vercel.app` | Production app domain URL |
| `NEXT_PUBLIC_DEFAULT_SHOP_ID` | Optional | `00000000-0000-0000-0000-000000000001` | Default Kirana shop UUID |
| `GNANI_API_KEY` | Optional | `your-gnani-api-key` | Gnani AI API Key (from app.gnani.ai) |
| `GNANI_API_BASE_URL` | Optional | `https://api.gnani.ai/v1` | Gnani AI Base Endpoint |
| `DATABASE_URL` | Optional | `postgresql://postgres:...` | Direct PostgreSQL connection string |

> **Note for Vercel Root Directory:**  
> In your Vercel Project Settings, set **Root Directory** to `frontend` (or leave as root since `vercel.json` is configured).

---

## 🔐 Google Cloud Console OAuth Configuration

To enable Google Sign-In on your deployed Vercel domain:

1. Open the [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Select your **OAuth 2.0 Client ID** used for VoiceOrder AI.
3. Under **Authorized JavaScript Origins**, add:
   - `http://localhost:3000` *(for local testing)*
   - `https://your-app-name.vercel.app` *(your production Vercel URL)*
4. Under **Authorized Redirect URIs**, add:
   - `https://wbkyektreqlpylbclvic.supabase.co/auth/v1/callback` *(Supabase Auth Callback)*
   - `http://localhost:3000/auth/callback`
   - `https://your-app-name.vercel.app/auth/callback`
5. In your [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication → URL Configuration**:
   - Set **Site URL** to: `https://your-app-name.vercel.app`
   - Add `https://your-app-name.vercel.app/**` to **Redirect URLs**.

---

## 🗄️ Database & Supabase Migrations

All tables, enums, triggers, and realistic seed data are tracked in `supabase/migrations/`:
- `20261024000000_init_voiceorder_schema.sql`: Full Kirana schema (`shops`, `categories`, `products`, `orders`, `order_items`, `stock_deduction_logs`).
- `20261024000001_seed_catalogue_items.sql`: 50+ real Indian Kirana products with Hindi names, categories, brands, MRP, and stock.
- `20261024000002_seed_orders_and_deductions_history.sql`: 12 real customer orders with Hindi voice transcripts and stock deduction audits.

To push schema changes to Supabase:
```bash
npx supabase db push
```

---

## 💻 Local Development Quickstart

### 1. Clone & Install
```bash
git clone https://github.com/Rajan-Prasaila-Yadav/VoiceOrde-AI.git
cd VoiceOrde-AI/frontend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `frontend/.env.local` and add your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL="https://wbkyektreqlpylbclvic.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser (or use mobile device preview).

### 4. Build Production Bundle
```bash
npm run build
```

---

## 👥 Default Demo Credentials
- **Role**: Store Owner / Admin
- **Email**: `rajanprasaila@gmail.com`
- **Password**: `Rajan123@`
- **Google Sign-In**: Supported via Supabase OAuth

---

## 📜 License
Developed for The Great Indian AI Internship Challenge by Gnani AI.
