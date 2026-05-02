import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'

export const dashboardRouter = Router()

dashboardRouter.get('/', async (req, res) => {
  const companyId = req.body.company_id

  const [customers, products, invoices] = await Promise.all([
    supabaseAdmin.from('customers').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabaseAdmin.from('invoices').select('grand_total,status,issue_date').eq('company_id', companyId),
  ])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlySales = (invoices.data ?? []).filter((i) => i.issue_date.startsWith(currentMonth)).reduce((sum, row) => sum + Number(row.grand_total), 0)
  const pendingInvoices = (invoices.data ?? []).filter((i) => ['draft', 'unpaid'].includes(i.status)).length

  res.json({
    totalCustomers: customers.count ?? 0,
    totalProducts: products.count ?? 0,
    monthlySales,
    pendingInvoices,
  })
})
