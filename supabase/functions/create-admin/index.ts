import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, role, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)
  if (role !== 'super_admin') return errorResponse('Forbidden', 403)

  const { email, password } = await req.json()
  if (!email || !password) return errorResponse('Email and password are required')
  if (password.length < 6) return errorResponse('Password must be at least 6 characters')

  const { data: authData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !authData.user) return errorResponse(createError?.message ?? 'Could not create user')

  const { error: insertError } = await supabase
    .from('users')
    .upsert(
      { id: authData.user.id, email, full_name: email, role: 'admin', company_id: null },
      { onConflict: 'id' }
    )

  if (insertError) return errorResponse(insertError.message)

  return jsonResponse({ id: authData.user.id, email }, 201)
})
