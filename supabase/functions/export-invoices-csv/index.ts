import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders, corsResponse, errorResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, companyId, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  const body = await req.json().catch(() => ({}))
  const month = body.month ?? new Date().toISOString().slice(0, 7)

  let query = supabase
    .from('invoices')
    .select('invoice_number,issue_date,status,grand_total')
    .like('issue_date', `${month}%`)
  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query
  if (error) return errorResponse(error.message)

  const lines = ['invoice_number,issue_date,status,grand_total']
  ;(data ?? []).forEach((row: any) => {
    lines.push(`${row.invoice_number},${row.issue_date},${row.status},${row.grand_total}`)
  })

  return new Response(lines.join('\n'), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="invoices-${month}.csv"`,
    },
  })
})
