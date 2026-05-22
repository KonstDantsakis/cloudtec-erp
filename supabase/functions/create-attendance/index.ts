import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase) return errorResponse(authError ?? 'Unauthorized', 401)

  const { customer_id, class_id, attendance_date, is_present } = await req.json()
  if (!customer_id || !attendance_date) return errorResponse('customer_id and attendance_date are required')

  const { data, error } = await supabase
    .from('attendance')
    .insert([{ customer_id, class_id, attendance_date, is_present }])
    .select('*')
    .single()

  if (error) return errorResponse(error.message)
  return jsonResponse(data, 201)
})
