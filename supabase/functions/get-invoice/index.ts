import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, companyId, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  const body = await req.json()
  const { id } = body

  if (!id) return errorResponse('id is required')

  let invoiceQuery = supabase.from('invoices').select('*').eq('id', id)
  if (companyId) invoiceQuery = invoiceQuery.eq('company_id', companyId)

  const [invoiceResult, itemsResult] = await Promise.all([
    invoiceQuery.single(),
    supabase.from('invoice_items').select('*').eq('invoice_id', id),
  ])

  if (invoiceResult.error) return errorResponse(invoiceResult.error.message)
  return jsonResponse({ invoice: invoiceResult.data, items: itemsResult.data ?? [] })
})
