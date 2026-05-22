import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase) return errorResponse(authError ?? 'Unauthorized', 401)

  const body = await req.json()
  const { title, description, level, capacity, price_cents, day_of_week, start_time, end_time, active } = body

  if (!title) return errorResponse('title is required')

  const { data, error } = await supabase
    .from('classes')
    .insert([{ title, description, level, capacity, price_cents, day_of_week, start_time, end_time, active }])
    .select('*')
    .single()

  if (error) return errorResponse(error.message)
  return jsonResponse(data, 201)
})
