import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, companyId, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  const [customers, products, invoices] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('invoices').select('grand_total,status,issue_date').eq('company_id', companyId),
  ])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlySales = (invoices.data ?? [])
    .filter((i: any) => i.issue_date.startsWith(currentMonth))
    .reduce((sum: number, row: any) => sum + Number(row.grand_total), 0)
  const pendingInvoices = (invoices.data ?? []).filter((i: any) => ['draft', 'unpaid'].includes(i.status)).length

  return jsonResponse({
    totalCustomers: customers.count ?? 0,
    totalProducts: products.count ?? 0,
    monthlySales,
    pendingInvoices,
  })
})
