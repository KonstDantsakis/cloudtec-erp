import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, companyId, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  const { id } = await req.json()

  if (!id) return errorResponse('id is required')

  let query = supabase.from('expenses').delete().eq('id', id)
  if (companyId) query = query.eq('company_id', companyId)

  const { error } = await query
  if (error) return errorResponse(error.message)
  return jsonResponse({ success: true })
})
