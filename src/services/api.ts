import { DashboardMetrics, Customer, Product, Invoice, Expense, Task, InvoiceItemInput } from '../types/models'
import { supabase } from '@/lib/supabaseClient'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

// Used by React components — auto-reads session token, returns { data, error }
export async function callEdge<T = unknown>(
  functionName: string,
  body: Record<string, unknown> = {},
): Promise<{ data: T | null; error: string | null }> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    return { data: null, error: (err as any).error ?? res.statusText }
  }

  return { data: (await res.json()) as T, error: null }
}

// Used by api object below — requires explicit token, throws on error
async function edge<T>(functionName: string, token: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error((payload as any).error ?? res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  getDashboard: (token: string) => edge<DashboardMetrics>('get-dashboard', token),

  listCustomers: (token: string, search?: string) =>
    edge<Customer[]>('get-customers', token, search ? { search } : {}),
  createCustomer: (token: string, body: Partial<Customer>) =>
    edge<Customer>('create-customer', token, body as Record<string, unknown>),
  updateCustomer: (token: string, id: string, body: Partial<Customer>) =>
    edge<Customer>('update-customer', token, { id, ...body }),
  deleteCustomer: (token: string, id: string) =>
    edge<void>('delete-customer', token, { id }),

  listProducts: (token: string, search?: string) =>
    edge<Product[]>('get-products', token, search ? { search } : {}),
  createProduct: (token: string, body: Partial<Product>) =>
    edge<Product>('create-product', token, body as Record<string, unknown>),
  updateProduct: (token: string, id: string, body: Partial<Product>) =>
    edge<Product>('update-product', token, { id, ...body }),
  deleteProduct: (token: string, id: string) =>
    edge<void>('delete-product', token, { id }),

  listInvoices: (token: string) => edge<Invoice[]>('get-invoices', token),
  getInvoice: (token: string, id: string) =>
    edge<{ invoice: Invoice; items: InvoiceItemInput[] }>('get-invoice', token, { id }),
  createInvoice: (
    token: string,
    payload: {
      customer_id: string
      issue_date: string
      due_date?: string
      status: Invoice['status']
      items: InvoiceItemInput[]
    },
  ) => edge<Invoice>('create-invoice', token, payload as Record<string, unknown>),

  listExpenses: (token: string) => edge<Expense[]>('get-company-expenses', token),
  createExpense: (token: string, body: Partial<Expense>) =>
    edge<Expense>('create-company-expense', token, body as Record<string, unknown>),
  updateExpense: (token: string, id: string, body: Partial<Expense>) =>
    edge<Expense>('update-company-expense', token, { id, ...body }),
  deleteExpense: (token: string, id: string) =>
    edge<void>('delete-company-expense', token, { id }),

  listTasks: (token: string) => edge<Task[]>('get-tasks', token),
  createTask: (token: string, body: Partial<Task>) =>
    edge<Task>('create-task', token, body as Record<string, unknown>),
  updateTask: (token: string, id: string, body: Partial<Task>) =>
    edge<Task>('update-task', token, { id, ...body }),
  deleteTask: (token: string, id: string) =>
    edge<void>('delete-task', token, { id }),

  getReportSummary: (token: string, month: string) =>
    edge('get-reports-summary', token, { month }),
  downloadReportCsv: async (token: string, month: string) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/export-invoices-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ month }),
    })
    if (!res.ok) throw new Error('CSV export failed')
    return res.blob()
  },
}
