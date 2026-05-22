import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase) return errorResponse(authError ?? 'Unauthorized', 401)

  const body = await req.json()
  const { date_from, date_to, class_ids, customer_ids } = body

  let query = supabase
    .from('attendance')
    .select('id, customer_id, class_id, attendance_date, is_present')

  if (date_from) query = query.gte('attendance_date', date_from)
  if (date_to) query = query.lt('attendance_date', date_to)
  if (class_ids?.length) query = query.in('class_id', class_ids)
  if (customer_ids?.length) query = query.in('customer_id', customer_ids)

  const { data, error } = await query
  if (error) return errorResponse(error.message)
  return jsonResponse(data ?? [])
})
