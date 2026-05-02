import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'

export const reportsRouter = Router()

reportsRouter.get('/summary', async (req, res) => {
  const month = (req.query.month as string | undefined) ?? new Date().toISOString().slice(0, 7)
  const companyId = req.body.company_id

  const [invoices, expenses] = await Promise.all([
    supabaseAdmin.from('invoices').select('grand_total,issue_date,status,customer_id,customers(name)').eq('company_id', companyId).in('status', ['unpaid', 'paid']),
    supabaseAdmin.from('expenses').select('amount,date').eq('company_id', companyId),
  ])

  const monthInvoices = (invoices.data ?? []).filter((i) => i.issue_date.startsWith(month))
  const monthExpenses = (expenses.data ?? []).filter((e) => e.date.startsWith(month))

  const monthlyIncome = monthInvoices.reduce((sum, row) => sum + Number(row.grand_total), 0)
  const monthlyExpenses = monthExpenses.reduce((sum, row) => sum + Number(row.amount), 0)

  const salesMap = new Map<string, number>()
  monthInvoices.forEach((row: any) => {
    const name = row.customers?.name ?? 'Unknown customer'
    salesMap.set(name, (salesMap.get(name) ?? 0) + Number(row.grand_total))
  })

  res.json({
    month,
    monthlyIncome,
    monthlyExpenses,
    profitEstimate: monthlyIncome - monthlyExpenses,
    salesPerCustomer: Array.from(salesMap.entries()).map(([customer, total]) => ({ customer, total })),
  })
})

reportsRouter.get('/export.csv', async (req, res) => {
  const month = (req.query.month as string | undefined) ?? new Date().toISOString().slice(0, 7)
  const companyId = req.body.company_id

  const { data } = await supabaseAdmin.from('invoices').select('invoice_number,issue_date,status,grand_total').eq('company_id', companyId).like('issue_date', `${month}%`)

  const lines = ['invoice_number,issue_date,status,grand_total']
  ;(data ?? []).forEach((row) => lines.push(`${row.invoice_number},${row.issue_date},${row.status},${row.grand_total}`))

  res.setHeader('Content-Type', 'text/csv')
  res.send(lines.join('\n'))
})
