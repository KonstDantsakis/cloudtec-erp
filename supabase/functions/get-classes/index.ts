import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase) return errorResponse(authError ?? 'Unauthorized', 401)

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) return errorResponse(error.message)
  return jsonResponse(data ?? [])
})
