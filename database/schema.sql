-- Multi-tenant ERP schema for Supabase/PostgreSQL
create extension if not exists "uuid-ossp";

create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  tax_number text,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key,
  company_id uuid references companies(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('super_admin', 'company_admin', 'employee')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  tax_number text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  type text not null check (type in ('product', 'service')),
  price numeric(12,2) not null,
  vat_rate numeric(5,2) not null default 24,
  stock_quantity numeric(12,2) not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  customer_id uuid not null references customers(id),
  invoice_number text not null,
  issue_date date not null,
  due_date date,
  status text not null check (status in ('draft', 'unpaid', 'paid', 'cancelled')),
  subtotal numeric(12,2) not null,
  vat_total numeric(12,2) not null,
  grand_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists invoice_items (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  product_id uuid not null references products(id),
  description text not null,
  quantity numeric(12,2) not null,
  unit_price numeric(12,2) not null,
  vat_rate numeric(5,2) not null,
  vat_amount numeric(12,2) not null,
  line_total numeric(12,2) not null
);

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  supplier text not null,
  category text not null,
  amount numeric(12,2) not null,
  vat numeric(5,2) not null,
  date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references users(id),
  status text not null check (status in ('pending', 'in_progress', 'done')),
  due_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_customers_company on customers(company_id);
create index if not exists idx_products_company on products(company_id);
create index if not exists idx_invoices_company on invoices(company_id);
create index if not exists idx_expenses_company on expenses(company_id);
create index if not exists idx_tasks_company on tasks(company_id);

-- Enable RLS + policies for strict tenant data isolation.
alter table companies enable row level security;
alter table users enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table expenses enable row level security;
alter table tasks enable row level security;

create policy company_isolation_customers on customers
for all using (company_id::text = auth.jwt()->>'company_id');

create policy company_isolation_products on products
for all using (company_id::text = auth.jwt()->>'company_id');

create policy company_isolation_invoices on invoices
for all using (company_id::text = auth.jwt()->>'company_id');

create policy company_isolation_invoice_items on invoice_items
for all using (company_id::text = auth.jwt()->>'company_id');

create policy company_isolation_expenses on expenses
for all using (company_id::text = auth.jwt()->>'company_id');

create policy company_isolation_tasks on tasks
for all using (company_id::text = auth.jwt()->>'company_id');
