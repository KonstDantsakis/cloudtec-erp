import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, companyId, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  if (!companyId) return errorResponse('User has no company assigned', 403)

  const body = await req.json()
  const { name, email, phone, address, tax_number, notes } = body

  if (!name || name.length < 2) return errorResponse('name must be at least 2 characters')

  const { data, error } = await supabase
    .from('customers')
    .insert({ name, email, phone, address, tax_number, notes, company_id: companyId })
    .select('*')
    .single()

  if (error) return errorResponse(error.message)
  return jsonResponse(data, 201)
})
