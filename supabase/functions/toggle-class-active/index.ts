import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase) return errorResponse(authError ?? 'Unauthorized', 401)

  const { id, active } = await req.json()
  if (!id || active === undefined) return errorResponse('id and active are required')

  const { data, error } = await supabase
    .from('classes')
    .update({ active })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return errorResponse(error.message)
  return jsonResponse(data)
})
