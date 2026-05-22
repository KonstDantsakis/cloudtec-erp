import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  const body = await req.json()
  const { vendor, category, amount_cents, currency, method, paid_at, notes, receipt_url } = body

  if (!vendor) return errorResponse('vendor is required')

  const { data, error } = await supabase
    .from('expenses')
    .insert([{ vendor, category, amount_cents, currency, method, paid_at, notes, receipt_url, created_by: user.id }])
    .select('*')
    .single()

  if (error) return errorResponse(error.message)
  return jsonResponse(data, 201)
})
