import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase) return errorResponse(authError ?? 'Unauthorized', 401)

  const { id, is_present } = await req.json()
  if (!id || is_present === undefined) return errorResponse('id and is_present are required')

  const { data, error } = await supabase
    .from('attendance')
    .update({ is_present, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return errorResponse(error.message)
  return jsonResponse(data)
})
