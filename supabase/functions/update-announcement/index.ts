import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase) return errorResponse(authError ?? 'Unauthorized', 401)

  const body = await req.json()
  const { id, ...fields } = body

  if (!id) return errorResponse('id is required')

  const { data, error } = await supabase
    .from('announcements')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return errorResponse(error.message)
  return jsonResponse(data)
})
