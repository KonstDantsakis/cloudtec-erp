import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, companyId, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  const body = await req.json().catch(() => ({}))
  const month = body.month ?? new Date().toISOString().slice(0, 7)

  let invoicesQuery = supabase
    .from('invoices')
    .select('grand_total,issue_date,status,customer_id,customers(name)')
    .in('status', ['unpaid', 'paid'])
  if (companyId) invoicesQuery = invoicesQuery.eq('company_id', companyId)

  let expensesQuery = supabase.from('expenses').select('amount,date')
  if (companyId) expensesQuery = expensesQuery.eq('company_id', companyId)

  const [invoicesResult, expensesResult] = await Promise.all([invoicesQuery, expensesQuery])

  const monthInvoices = (invoicesResult.data ?? []).filter((i: any) => i.issue_date.startsWith(month))
  const monthExpenses = (expensesResult.data ?? []).filter((e: any) => e.date?.startsWith(month))

  const monthlyIncome = monthInvoices.reduce((sum: number, row: any) => sum + Number(row.grand_total), 0)
  const monthlyExpenses = monthExpenses.reduce((sum: number, row: any) => sum + Number(row.amount), 0)

  const salesMap = new Map<string, number>()
  monthInvoices.forEach((row: any) => {
    const name = row.customers?.name ?? 'Unknown customer'
    salesMap.set(name, (salesMap.get(name) ?? 0) + Number(row.grand_total))
  })

  return jsonResponse({
    month,
    monthlyIncome,
    monthlyExpenses,
    profitEstimate: monthlyIncome - monthlyExpenses,
    salesPerCustomer: Array.from(salesMap.entries()).map(([customer, total]) => ({ customer, total })),
  })
})
