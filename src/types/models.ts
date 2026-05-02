export type Role = 'super_admin' | 'company_admin' | 'employee'

export interface SessionUser {
  id: string
  company_id: string | null
  role: Role
  email: string
  full_name: string
}

export interface DashboardMetrics {
  totalCustomers: number
  totalProducts: number
  monthlySales: number
  pendingInvoices: number
}

export interface Customer {
  id: string
  company_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  tax_number: string | null
  notes: string | null
}

export interface Product {
  id: string
  company_id: string
  name: string
  type: 'product' | 'service'
  price: number
  vat_rate: number
  stock_quantity: number
  description: string | null
}

export interface InvoiceItemInput {
  product_id: string
  description: string
  quantity: number
  unit_price: number
  vat_rate: number
}

export interface Invoice {
  id: string
  company_id: string
  customer_id: string
  invoice_number: string
  issue_date: string
  due_date: string | null
  status: 'draft' | 'unpaid' | 'paid' | 'cancelled'
  subtotal: number
  vat_total: number
  grand_total: number
}

export interface Expense {
  id: string
  company_id: string
  supplier: string
  category: string
  amount: number
  vat: number
  date: string
  notes: string | null
}

export interface Task {
  id: string
  company_id: string
  title: string
  description: string | null
  assigned_to: string | null
  status: 'pending' | 'in_progress' | 'done'
  due_date: string | null
}
