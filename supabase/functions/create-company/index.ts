import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsResponse, errorResponse, jsonResponse, verifyAuth } from '../_shared/index.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  const { user, supabase, error: authError } = await verifyAuth(req)
  if (authError || !supabase || !user) return errorResponse(authError ?? 'Unauthorized', 401)

  const body = await req.json()
  const { name, tax_number, address, phone, email, website } = body

  if (!name || name.trim().length < 2) return errorResponse('Company name is required')

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ name: name.trim(), tax_number, address, phone, email, website })
    .select()
    .single()

  if (companyError || !company) return errorResponse(companyError?.message ?? 'Could not create company')

  const { error: updateError } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? user.email ?? '',
        company_id: company.id,
        role: 'company_admin',
      },
      { onConflict: 'id' }
    )

  if (updateError) return errorResponse(updateError.message)

  return jsonResponse({ company_id: company.id, company }, 201)
})
