import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  const { title, message, class_id, is_active } = await req.json()
  if (!title || !message) return errorResponse('title and message are required')

  const { data, error } = await supabase
    .from('announcements')
    .insert([{ title, message, class_id: class_id || null, is_active: is_active ?? true, created_by: user.id, created_at: new Date().toISOString() }])
    .select('*')
    .single()

  if (error) return errorResponse(error.message)
  return jsonResponse(data, 201)
})
