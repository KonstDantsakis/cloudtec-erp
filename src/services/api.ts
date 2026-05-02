import { DashboardMetrics, Customer, Product, Invoice, Expense, Task, InvoiceItemInput } from '../types/models'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.message ?? 'Request failed')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  getDashboard: (token: string) => request<DashboardMetrics>('/dashboard', token),

  listCustomers: (token: string, search?: string) => request<Customer[]>(`/customers?search=${encodeURIComponent(search ?? '')}`, token),
  createCustomer: (token: string, body: Partial<Customer>) => request<Customer>('/customers', token, { method: 'POST', body: JSON.stringify(body) }),
  updateCustomer: (token: string, id: string, body: Partial<Customer>) => request<Customer>(`/customers/${id}`, token, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCustomer: (token: string, id: string) => request<void>(`/customers/${id}`, token, { method: 'DELETE' }),

  listProducts: (token: string, search?: string) => request<Product[]>(`/products?search=${encodeURIComponent(search ?? '')}`, token),
  createProduct: (token: string, body: Partial<Product>) => request<Product>('/products', token, { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (token: string, id: string, body: Partial<Product>) => request<Product>(`/products/${id}`, token, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (token: string, id: string) => request<void>(`/products/${id}`, token, { method: 'DELETE' }),

  listInvoices: (token: string) => request<Invoice[]>('/invoices', token),
  getInvoice: (token: string, id: string) => request<{ invoice: Invoice; items: InvoiceItemInput[] }>(`/invoices/${id}`, token),
  createInvoice: (
    token: string,
    payload: {
      customer_id: string
      issue_date: string
      due_date?: string
      status: Invoice['status']
      items: InvoiceItemInput[]
    },
  ) => request<Invoice>('/invoices', token, { method: 'POST', body: JSON.stringify(payload) }),

  listExpenses: (token: string) => request<Expense[]>('/expenses', token),
  createExpense: (token: string, body: Partial<Expense>) => request<Expense>('/expenses', token, { method: 'POST', body: JSON.stringify(body) }),
  updateExpense: (token: string, id: string, body: Partial<Expense>) => request<Expense>(`/expenses/${id}`, token, { method: 'PUT', body: JSON.stringify(body) }),
  deleteExpense: (token: string, id: string) => request<void>(`/expenses/${id}`, token, { method: 'DELETE' }),

  listTasks: (token: string) => request<Task[]>('/tasks', token),
  createTask: (token: string, body: Partial<Task>) => request<Task>('/tasks', token, { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (token: string, id: string, body: Partial<Task>) => request<Task>(`/tasks/${id}`, token, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTask: (token: string, id: string) => request<void>(`/tasks/${id}`, token, { method: 'DELETE' }),

  getReportSummary: (token: string, month: string) => request('/reports/summary?month=' + month, token),
  downloadReportCsv: async (token: string, month: string) => {
    const response = await fetch(`${API_URL}/reports/export.csv?month=${encodeURIComponent(month)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) throw new Error('CSV export failed')
    return response.blob()
  },
}
