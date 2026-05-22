import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, role, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)
  if (role !== 'super_admin') return errorResponse('Forbidden', 403)

  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at, companies(name)')
    .eq('role', 'admin')
    .order('created_at', { ascending: false })

  if (error) return errorResponse(error.message)

  return jsonResponse(data ?? [])
})
