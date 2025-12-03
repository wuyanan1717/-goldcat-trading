// supabase/functions/creem-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload = await req.json()
        console.log('Received Payload:', JSON.stringify(payload))

        // 修正：Creem 的数据在 payload.object 中
        const eventObject = payload.object || {}
        const customer = eventObject.customer || {}

        // 修正：获取邮箱的正确路径
        const userEmail = customer.email

        console.log(`Processing activation for email: ${userEmail}`)

        if (!userEmail) {
            console.error('No email found in payload:', JSON.stringify(payload))
            return new Response(
                JSON.stringify({ message: 'No email found, skipped' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // 初始化 Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 更新会员状态 - 会员期限为 1 年
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 年后到期

        const { data: profile, error: updateError } = await supabase
            .from('profiles')
            .update({
                is_premium: true,
                membership_expiry: expiryDate.toISOString(), // 1 年有效期
                creem_customer_id: customer.id,
                creem_license_id: eventObject.id, // 使用 checkout id 作为凭证
                updated_at: new Date().toISOString()
            })
            .eq('email', userEmail)
            .select()

        if (updateError) {
            console.error('Database update failed:', updateError)
            throw updateError
        }

        console.log('Success! Profile updated:', profile)

        return new Response(
            JSON.stringify({ message: `Activated premium for ${userEmail}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
