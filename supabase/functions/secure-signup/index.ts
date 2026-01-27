import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        // 1. Get client IP (trust edge headers)
        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("cf-connecting-ip")

        if (!ip) {
            return new Response(
                JSON.stringify({ error: "Unable to determine IP address" }),
                { status: 400, headers: corsHeaders }
            )
        }

        // 2. Parse body
        const { email, password, username } = await req.json()
        if (!email || !password) {
            return new Response(
                JSON.stringify({ error: "Missing email or password" }),
                { status: 400, headers: corsHeaders }
            )
        }

        // 3. Init service role client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        )

        // 4. IP LIMIT CHECK (Atomic & Security-Definer backed)
        const { data: allowed, error: limitError } = await supabase.rpc(
            "check_registration_limit",
            { client_ip: ip }
        )

        if (limitError) {
            console.error("IP check failed:", limitError)
            throw new Error("Security check failed")
        }

        if (!allowed) {
            return new Response(
                JSON.stringify({
                    error: "Registration limit reached for this IP (max 4 accounts).",
                }),
                { status: 429, headers: corsHeaders }
            )
        }

        // 5. ADMIN CREATE USER (Auto-Confirm = NO EMAIL SENT)
        // We use admin.createUser to skip the email verification flow entirely.
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // <--- CRITICAL: User is confirmed immediately. No email sent.
            user_metadata: { username },
        })

        if (error) {
            throw error
        }

        return new Response(
            JSON.stringify({ data }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        )
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        )
    }
})
