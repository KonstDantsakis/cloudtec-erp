import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, role, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)
  if (role !== 'super_admin') return errorResponse('Forbidden', 403)

  const { id } = await req.json()
  if (!id) return errorResponse('User id is required')

  await supabase.from('users').delete().eq('id', id)
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return errorResponse(error.message)

  return jsonResponse({ success: true })
})
