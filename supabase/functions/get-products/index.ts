import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, companyId, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  const body = await req.json().catch(() => ({}))
  const { search } = body

  let query = supabase.from('products').select('*').order('created_at', { ascending: false })
  if (companyId) query = query.eq('company_id', companyId)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) return errorResponse(error.message)
  return jsonResponse(data ?? [])
})
