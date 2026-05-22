import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, corsResponse, errorResponse, jsonResponse } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const body = await req.json()
    const { email, password, full_name, phone } = body

    if (!email || !password) return errorResponse('email and password are required')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // 1) Create auth user with email/password
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name, role: 'user' },
      email_confirm: false,
    })

    if (authError || !userData?.user) {
      return errorResponse(authError?.message ?? 'Auth error')
    }

    const userId = userData.user.id

    // 2) Insert customer record
    const { error: customerError } = await supabase.from('customers').insert({
      auth_user_id: userId,
      full_name,
      email,
      phone,
      registration_status: 'pending',
    })

    if (customerError) {
      return errorResponse(customerError.message)
    }

    return jsonResponse({ success: true, user_id: userId }, 201)
  } catch (e) {
    console.error(e)
    return errorResponse('Unexpected error', 500)
  }
})
