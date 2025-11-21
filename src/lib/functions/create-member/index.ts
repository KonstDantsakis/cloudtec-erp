import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json()

    const {
      full_name,
      email,
      phone,
      date_of_birth,
      status,
      source,
      notes,
    } = body

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // 🔑 Τα παίρνουμε από .env της function (ΟΧΙ από React)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // 1) Δημιουργία user στο auth
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      phone,
      email_confirm: false,
    })

    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: authError?.message ?? 'Auth error' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const userId = userData.user.id

    // 2) profiles
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      full_name,
      phone,
      role: 'user',
    })

    if (profileError) {
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // 3) customers
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        id: userId,
        full_name,
        email,
        phone,
        date_of_birth,
        status,
        source,
        notes,
      })
      .select()
      .single()

    if (customerError) {
      return new Response(
        JSON.stringify({ error: customerError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ customer }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(
      JSON.stringify({ error: 'Unexpected error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
