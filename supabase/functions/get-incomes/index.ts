import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase) return errorResponse(authError ?? 'Unauthorized', 401)

  const { data, error } = await supabase
    .from('incomes')
    .select('*, customers(id, full_name), classes(id, title)')
    .order('paid_at', { ascending: false })

  if (error) return errorResponse(error.message)
  return jsonResponse(data ?? [])
})
