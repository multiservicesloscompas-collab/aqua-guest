import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    const { data: { user: currentUser }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !currentUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: currentProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single()

    if (profileError || !currentProfile) {
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { email, username, password, fullName, role, companyId, companyData } = body

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (currentProfile.role === 'admin' && role !== 'client') {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin can only create clients' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (currentProfile.role === 'client' && role !== 'employee') {
      return new Response(
        JSON.stringify({ success: false, error: 'Client can only create employees' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (currentProfile.role === 'employee') {
      return new Response(
        JSON.stringify({ success: false, error: 'Employees cannot create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let finalCompanyId = companyId

    if (currentProfile.role === 'admin' && companyData) {
      const { data: newCompany, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({
          name: companyData.name,
          rif: companyData.rif,
          address: companyData.address,
          phone: companyData.phone,
        })
        .select()
        .single()

      if (companyError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create company: ' + companyError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      finalCompanyId = newCompany.id
    }

    if (currentProfile.role === 'client') {
      finalCompanyId = currentProfile.company_id
    }

    console.log('Creating user with email:', email)
    
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authCreateError || !authData.user) {
      console.error('Failed to create auth user:', authCreateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create user: ' + authCreateError?.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Auth user created with ID:', authData.user.id)

    const { error: profileCreateError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        username: username || null,
        full_name: fullName || null,
        role,
        company_id: finalCompanyId,
        created_by: currentUser.id,
      })

    if (profileCreateError) {
      console.error('Failed to create profile:', profileCreateError)
      console.log('Attempting rollback - deleting user:', authData.user.id)
      
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      if (deleteError) {
        console.error('Rollback failed:', deleteError)
      } else {
        console.log('Rollback successful')
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create profile: ' + profileCreateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Profile created successfully')

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email,
          username,
          role,
          companyId: finalCompanyId,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
