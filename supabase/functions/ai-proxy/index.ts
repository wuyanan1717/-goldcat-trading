
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
    const requestOrigin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(requestOrigin);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Initialize Supabase Client (Auth Check)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        // Client for Auth Verification
        const authClient = createClient(
            supabaseUrl,
            supabaseAnonKey,
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 2. Get User
        const {
            data: { user },
        } = await authClient.auth.getUser()

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // 3. Initialize Admin Client (For DB Operations - Bypass RLS)
        const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

        // 4. Get Membership Status
        const { data: profile, error: profileError } = await adminClient
            .from('profiles')
            .select('is_premium')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error("Profile Fetch Error:", profileError);
        }

        const isPremium = profile?.is_premium === true;
        // User Business Logic: Free=2, Premium=30
        const DAILY_LIMIT = isPremium ? 30 : 2;

        const now = new Date();
        const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        const today = beijingTime.toISOString().split('T')[0];

        // Fetch current count (Admin)
        const { data: usageData } = await adminClient
            .from('daily_scan_counts')
            .select('count')
            .eq('user_id', user.id)
            .eq('scan_date', today)
            .single();

        const currentCount = usageData?.count || 0;

        if (currentCount >= DAILY_LIMIT) {
            return new Response(JSON.stringify({
                error: 'Daily Limit Reached',
                limit: DAILY_LIMIT,
                isPremium,
                count: currentCount
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 429,
            })
        }

        // Increment Count (Admin)
        const { error: upsertError } = await adminClient
            .from('daily_scan_counts')
            .upsert({
                user_id: user.id,
                scan_date: today,
                count: currentCount + 1,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, scan_date' })

        if (upsertError) {
            console.error("DB Error:", upsertError);
            return new Response(JSON.stringify({
                error: 'Database Error',
                details: upsertError
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 5. Call Gemini API (Direct REST API instead of SDK)
        const { prompt, temperature = 0.7 } = await req.json()
        const apiKey = Deno.env.get('GOOGLE_API_KEY')

        // Use gemini-2.0-flash based on available models list
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey!
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: temperature,
                    maxOutputTokens: 2048,
                }
            })
        })

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text()
            console.error('Gemini API Error:', errorBody)
            throw new Error(`Gemini API returned ${geminiResponse.status}: ${errorBody}`)
        }

        const geminiData = await geminiResponse.json()
        const text = geminiData.candidates[0].content.parts[0].text

        return new Response(JSON.stringify({ text, remaining: DAILY_LIMIT - (currentCount + 1) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
