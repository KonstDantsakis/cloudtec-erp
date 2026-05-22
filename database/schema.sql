-- ================================================================
-- Cloudtec ERP — Multi-tenant schema for Supabase / PostgreSQL
-- Run this in the Supabase SQL editor (service role)
-- ================================================================

create extension if not exists "uuid-ossp";

-- ================================================================
-- TABLES
-- ================================================================

-- 1. Companies (one row per tenant)
create table if not exists companies (
  id          uuid          primary key default uuid_generate_v4(),
  name        text          not null,
  tax_number  text,
  logo_url    text,
  address     text,
  phone       text,
  email       text,
  website     text,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

-- 2. Users (mirrors auth.users; populated via trigger on sign-up)
create table if not exists users (
  id          uuid          primary key,  -- same UUID as auth.users.id
  company_id  uuid          references companies(id) on delete cascade,
  full_name   text          not null,
  email       text          not null unique,
  role        text          not null check (role in ('super_admin', 'company_admin', 'employee')),
  is_active   boolean       not null default true,
  created_at  timestamptz   not null default now()
);

-- 3. Customers
create table if not exists customers (
  id          uuid          primary key default uuid_generate_v4(),
  company_id  uuid          not null references companies(id) on delete cascade,
  name        text          not null,
  email       text,
  phone       text,
  address     text,
  tax_number  text,
  notes       text,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

-- 4. Products / Services
create table if not exists products (
  id             uuid          primary key default uuid_generate_v4(),
  company_id     uuid          not null references companies(id) on delete cascade,
  name           text          not null,
  type           text          not null check (type in ('product', 'service')),
  price          numeric(12,2) not null check (price >= 0),
  vat_rate       numeric(5,2)  not null default 24 check (vat_rate >= 0),
  stock_quantity numeric(12,2) not null default 0,
  description    text,
  is_active      boolean       not null default true,
  created_at     timestamptz   not null default now(),
  updated_at     timestamptz   not null default now()
);

-- 5. Invoices
create table if not exists invoices (
  id             uuid          primary key default uuid_generate_v4(),
  company_id     uuid          not null references companies(id) on delete cascade,
  customer_id    uuid          not null references customers(id),
  invoice_number text          not null,
  issue_date     date          not null,
  due_date       date,
  status         text          not null default 'draft' check (status in ('draft', 'unpaid', 'paid', 'cancelled')),
  subtotal       numeric(12,2) not null default 0,
  vat_total      numeric(12,2) not null default 0,
  grand_total    numeric(12,2) not null default 0,
  notes          text,
  created_at     timestamptz   not null default now(),
  updated_at     timestamptz   not null default now(),
  unique (company_id, invoice_number)
);

-- 6. Invoice line items
create table if not exists invoice_items (
  id          uuid          primary key default uuid_generate_v4(),
  company_id  uuid          not null references companies(id) on delete cascade,
  invoice_id  uuid          not null references invoices(id) on delete cascade,
  product_id  uuid          references products(id) on delete set null,
  description text          not null,
  quantity    numeric(12,2) not null check (quantity > 0),
  unit_price  numeric(12,2) not null check (unit_price >= 0),
  vat_rate    numeric(5,2)  not null check (vat_rate >= 0),
  vat_amount  numeric(12,2) not null,
  line_total  numeric(12,2) not null
);

-- 7. Expenses
create table if not exists expenses (
  id          uuid          primary key default uuid_generate_v4(),
  company_id  uuid          not null references companies(id) on delete cascade,
  supplier    text          not null,
  category    text          not null,
  amount      numeric(12,2) not null check (amount >= 0),
  vat         numeric(5,2)  not null default 0 check (vat >= 0),
  date        date          not null,
  notes       text,
  receipt_url text,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

-- 8. Tasks
create table if not exists tasks (
  id          uuid          primary key default uuid_generate_v4(),
  company_id  uuid          not null references companies(id) on delete cascade,
  title       text          not null,
  description text,
  assigned_to uuid          references users(id) on delete set null,
  status      text          not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  due_date    date,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

-- ================================================================
-- INDEXES
-- ================================================================

create index if not exists idx_users_company         on users(company_id);
create index if not exists idx_customers_company     on customers(company_id);
create index if not exists idx_products_company      on products(company_id);
create index if not exists idx_invoices_company      on invoices(company_id);
create index if not exists idx_invoices_customer     on invoices(customer_id);
create index if not exists idx_invoices_status       on invoices(status);
create index if not exists idx_invoice_items_company on invoice_items(company_id);
create index if not exists idx_invoice_items_invoice on invoice_items(invoice_id);
create index if not exists idx_expenses_company      on expenses(company_id);
create index if not exists idx_expenses_date         on expenses(date);
create index if not exists idx_tasks_company         on tasks(company_id);
create index if not exists idx_tasks_assigned_to     on tasks(assigned_to);

-- ================================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ================================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_companies_updated_at
  before update on companies for each row execute function set_updated_at();
create or replace trigger trg_customers_updated_at
  before update on customers for each row execute function set_updated_at();
create or replace trigger trg_products_updated_at
  before update on products  for each row execute function set_updated_at();
create or replace trigger trg_invoices_updated_at
  before update on invoices  for each row execute function set_updated_at();
create or replace trigger trg_expenses_updated_at
  before update on expenses  for each row execute function set_updated_at();
create or replace trigger trg_tasks_updated_at
  before update on tasks     for each row execute function set_updated_at();

-- ================================================================
-- AUTO-SYNC auth.users → public.users ON SIGN-UP
-- Reads company_id, full_name, and role from user_metadata set at
-- sign-up (or via supabase.auth.admin.createUser).
-- ================================================================

create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, company_id, full_name, email, role)
  values (
    new.id,
    (new.raw_user_meta_data->>'company_id')::uuid,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

alter table companies     enable row level security;
alter table users         enable row level security;
alter table customers     enable row level security;
alter table products      enable row level security;
alter table invoices      enable row level security;
alter table invoice_items enable row level security;
alter table expenses      enable row level security;
alter table tasks         enable row level security;

-- Helper: calling user's company_id (from public.users, not JWT)
create or replace function auth_company_id()
returns uuid language sql stable security definer as $$
  select company_id from public.users where id = auth.uid();
$$;

-- Helper: true if calling user is super_admin
create or replace function is_super_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Helper: true if calling user is company_admin or super_admin
create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role in ('super_admin', 'company_admin')
  );
$$;

-- companies: super_admin sees all; others see only their own company
create policy "companies: tenant isolation" on companies
  for all using (
    is_super_admin() or id = auth_company_id()
  );

-- users: super_admin sees all; others see users in the same company
create policy "users: select same company" on users
  for select using (
    is_super_admin() or company_id = auth_company_id() or id = auth.uid()
  );
create policy "users: insert by admin" on users
  for insert with check (
    is_super_admin() or (
      is_admin() and company_id = auth_company_id()
    )
  );
create policy "users: update self or admin" on users
  for update using (
    id = auth.uid() or is_super_admin() or (is_admin() and company_id = auth_company_id())
  );
create policy "users: delete by admin" on users
  for delete using (
    is_super_admin() or (is_admin() and company_id = auth_company_id())
  );

-- customers
create policy "customers: company isolation" on customers
  for all using (is_super_admin() or company_id = auth_company_id());

-- products
create policy "products: company isolation" on products
  for all using (is_super_admin() or company_id = auth_company_id());

-- invoices
create policy "invoices: company isolation" on invoices
  for all using (is_super_admin() or company_id = auth_company_id());

-- invoice_items
create policy "invoice_items: company isolation" on invoice_items
  for all using (is_super_admin() or company_id = auth_company_id());

-- expenses
create policy "expenses: company isolation" on expenses
  for all using (is_super_admin() or company_id = auth_company_id());

-- tasks
create policy "tasks: company isolation" on tasks
  for all using (is_super_admin() or company_id = auth_company_id());
