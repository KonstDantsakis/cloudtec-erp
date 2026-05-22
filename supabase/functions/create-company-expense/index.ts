import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, companyId, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  if (!companyId) return errorResponse('User has no company assigned', 403)

  const body = await req.json()
  const { supplier, category, amount, vat, date, notes } = body

  if (!supplier || supplier.length < 2) return errorResponse('supplier must be at least 2 characters')
  if (!category || category.length < 2) return errorResponse('category must be at least 2 characters')
  if (!amount || amount <= 0) return errorResponse('amount must be positive')

  const { data, error } = await supabase
    .from('expenses')
    .insert({ company_id: companyId, supplier, category, amount, vat, date, notes })
    .select('*')
    .single()

  if (error) return errorResponse(error.message)
  return jsonResponse(data, 201)
})
