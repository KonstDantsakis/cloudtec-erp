# Multi-tenant ERP (React + TypeScript + Supabase)

A clean starter ERP for small businesses with strict tenant isolation.

## Stack
- **Frontend:** React + TypeScript + Vite
- **Backend API:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth (JWT)

## Project structure

```txt
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.ts
│   └── .env.example
├── database/
│   ├── schema.sql
│   └── seed.sql
└── src/
    ├── app/
    ├── components/
    ├── features/
    ├── locales/
    ├── services/
    ├── types/
    └── styles.css
```

## Backend API endpoints

- `GET /health`
- `GET /api/dashboard`
- `GET|POST|PUT|DELETE /api/customers`
- `GET|POST|PUT|DELETE /api/products`
- `GET|POST /api/invoices`
- `GET /api/invoices/:id`
- `GET|POST|PUT|DELETE /api/expenses`
- `GET|POST|PUT|DELETE /api/tasks`
- `GET /api/reports/summary?month=YYYY-MM`
- `GET /api/reports/export.csv?month=YYYY-MM`

All `/api/*` endpoints require `Authorization: Bearer <supabase_access_token>` and enforce tenant filtering with `company_id`.

## Setup

### 1) Database
Run SQL files in Supabase SQL editor:
1. `database/schema.sql`
2. `database/seed.sql`

### 2) Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3) Frontend
```bash
npm install
npm start
```

Create `.env` in root:

```bash
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Security notes
- JWT authentication on every API call.
- Tenant isolation in backend filters and SQL RLS policies.
- Role model supported: `super_admin`, `company_admin`, `employee`.
- Input validation via `zod` on write endpoints.

## Module status
- ✅ Dashboard
- ✅ Customers CRUD + search
- ✅ Products/Services CRUD + search
- ✅ Invoices with line items, VAT totals, printable view
- ✅ Expenses CRUD
- ✅ Tasks CRUD
- ✅ Reports + CSV export
