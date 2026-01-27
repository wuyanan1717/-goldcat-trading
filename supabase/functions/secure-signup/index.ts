import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extract client IP (Vercel priority)
    const clientIp =
      req.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'

    console.log(`[Registration] Attempting from IP: ${clientIp}`)

    // 2. Parse request body
    const { email, password, username } = await req.json()

    if (!email || !password || !username) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: email, password, username'
        }),
        {
          status: 200, // Business logic error, not network error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 3. Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)

    // 4. Check IP registration limit (RPC call)
    const { data: allowed, error: rpcError } = await serviceClient.rpc('check_registration_limit', {
      client_ip: clientIp
    })

    if (rpcError) {
      console.error('[IP Check Error]:', rpcError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to verify registration limit'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!allowed) {
      console.log(`[IP Limit] Blocked IP: ${clientIp}`)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Registration limit reached for this device/IP.'
        }),
        {
          status: 200, // Business logic error (not network error)
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 5. Create user with admin client
    const { data: userData, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: { username },
    })

    if (createError) {
      console.error('[User Creation Error]:', createError)

      // Handle specific errors
      if (createError.message.includes('already been registered') ||
        createError.message.includes('User already registered')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email already registered'
          }),
          {
            status: 200, // Business logic error (not network error)
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      if (createError.message.includes('Password should be')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Password must be at least 6 characters'
          }),
          {
            status: 200, // Business logic error (not network error)
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: createError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[User Created] ID: ${userData.user.id}, Email: ${email}`)

    // 6. Sign in immediately to get session (with retry for eventual consistency)
    let sessionData = null
    const maxRetries = 5

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
        email,
        password,
      })

      if (!signInError && signInData?.session) {
        sessionData = signInData.session
        console.log(`[Sign-in Success] Attempt ${attempt + 1}/${maxRetries}`)
        break
      }

      if (signInError) {
        console.warn(`[Sign-in Retry ${attempt + 1}/${maxRetries}]:`, signInError.message)
      }

      // Wait 200ms before retry (exponential consistency window)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    // 7. Return success with session tokens (or graceful degradation)
    if (sessionData) {
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: userData.user.id,
            email: userData.user.email,
            user_metadata: userData.user.user_metadata,
          },
          session: {
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      // User created but auto-login failed (rare, but handled)
      console.warn('[Graceful Degradation] User created but session unavailable')
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: userData.user.id,
            email: userData.user.email,
          },
          session: null,
          message: 'User created successfully. Please log in manually.',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (err) {
    console.error('[Unhandled Error]:', err)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
