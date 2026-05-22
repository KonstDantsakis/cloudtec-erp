import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, companyId, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  const body = await req.json()
  const { id, company_id: _c, ...fields } = body

  if (!id) return errorResponse('id is required')

  let query = supabase.from('customers').update(fields).eq('id', id)
  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query.select('*').single()
  if (error) return errorResponse(error.message)
  return jsonResponse(data)
})
