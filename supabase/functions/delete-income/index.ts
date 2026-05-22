import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase) return errorResponse(authError ?? 'Unauthorized', 401)

  const { id } = await req.json()
  if (!id) return errorResponse('id is required')

  const { error } = await supabase.from('incomes').delete().eq('id', id)
  if (error) return errorResponse(error.message)
  return jsonResponse({ success: true })
})
