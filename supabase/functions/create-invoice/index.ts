import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, companyId, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  if (!companyId) return errorResponse('User has no company assigned', 403)

  const body = await req.json()
  const { customer_id, issue_date, due_date, status, items } = body

  if (!customer_id || !issue_date || !items?.length) {
    return errorResponse('customer_id, issue_date, and items are required')
  }

  const subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0)
  const vat_total = items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price * (item.vat_rate / 100), 0)
  const grand_total = subtotal + vat_total
  const invoice_number = `INV-${Date.now()}`

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({ company_id: companyId, customer_id, issue_date, due_date, status, invoice_number, subtotal, vat_total, grand_total })
    .select('*')
    .single()

  if (invoiceError || !invoice) return errorResponse(invoiceError?.message ?? 'Could not create invoice')

  const itemRows = items.map((item: any) => ({
    company_id: companyId,
    invoice_id: invoice.id,
    product_id: item.product_id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    vat_rate: item.vat_rate,
    line_total: item.quantity * item.unit_price,
    vat_amount: item.quantity * item.unit_price * (item.vat_rate / 100),
  }))

  const { error: itemsError } = await supabase.from('invoice_items').insert(itemRows)
  if (itemsError) return errorResponse(itemsError.message)

  return jsonResponse(invoice, 201)
})
