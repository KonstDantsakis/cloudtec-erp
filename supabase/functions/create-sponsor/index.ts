import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  const body = await req.json()
  const { name, description, logo_url, link_url, position, is_active } = body

  if (!name) return errorResponse('name is required')

  const { data, error } = await supabase
    .from('sponsors')
    .insert([{
      name,
      description,
      logo_url,
      link_url,
      position,
      is_active: is_active ?? true,
      created_by: user.id,
      created_at: new Date().toISOString(),
    }])
    .select('*')
    .single()

  if (error) return errorResponse(error.message)
  return jsonResponse(data, 201)
})
