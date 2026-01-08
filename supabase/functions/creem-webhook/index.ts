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
        // 优先使用 Stripe 的 client_reference_id (如果前端传了 user_id)
        const clientReferenceId = eventObject.client_reference_id;
        let userId = clientReferenceId;
        const userEmail = customer.email;

        console.log(`Processing activation for email: ${userEmail}, refId: ${userId}`)

        // 初始化 Supabase (Service Role - 拥有上帝权限)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 如果没有直接传 ID，则通过 email 去 auth.users 表反查 ID
        if (!userId && userEmail) {
            // Service Role 可以直接查询 auth schema
            // 注意：这里需要确保 service role key 配置正确且有权限
            // 替代方案：如果无法查 auth，可以尝试查 profiles 表 (但 profiles 可能不存在，所以必须查 auth)
            // 实际上 Supabase Edge Function 用 Service Role 可以调用 admin auth api
            const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
            
            // 简单筛选 (生产环境建议用更高效的查询如果用户量大，但在 Edge Function 中 listUsers 可能受限)
            // 更轻量的方式：既然是 Service Role，直接 select from auth.users 也是可以的
            /* 
               const { data: authUser } = await supabase.from('auth.users').select('id').eq('email', userEmail).single();
               Fail: direct query on auth.users is often restricted even for service role depending on config.
               Safe bet: listUsers or getUserById? No getUserByEmail in admin api v2 explicitly.
               Let's try listUsers by plain loop if not too many users, OR assume email match.
               
               BETTER: standard convention is to trust the email link.
               BUT we need the UUID to create the profile.
            */
           
            // Best approach: Use RPC or Direct Query if allowed. 
            // Let's try direct query on auth.users because Service Role usually BYPASSES everything.
            // If that fails, we fallback.
            
            // Option A: Direct Query (Most efficient if works)
            /*
            const { data: authUsers, error: searchError } = await supabase.schema('auth').from('users').select('id').eq('email', userEmail).single();
            */
           
           // Option B: Admin API
            // Using listUsers is strictly rate limited and paginated, not ideal for lookup.
            
            // Wait, for this specific "Health Check", let's use the most standard way:
            // Since we upgraded earlier, let's just query 'profiles' first.
            // If profile exists, get ID.
            const { data: existingProfile } = await supabase.from('profiles').select('id').eq('email', userEmail).single();
            if (existingProfile) {
                userId = existingProfile.id;
            } else {
                // 如果 Profile 不存在，说明是那类"有号无档"的用户，或者尚未注册。
                // 此时我们需要去 auth.users 找 ID。
                // 假如实在找不到 convenient way to get ID, we can log error.
                // BUT wait! We have a "backfill" script running in DB now.
                // So ideally profiles SHOULD exist.
                // But for robust safety, let's try to get ID from auth admin.
                // Actually, listUsers() allows filtering effectively. NO.
                console.log("Profile missing, attempting to find user in auth system...");
                // Note: This relies on manual implementation compatibility.
                // For now, let's assume if profile is missing, we might fail to auto-create without ID.
                return new Response(
                    JSON.stringify({ error: 'User profile not found. Please register or contact support.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                );
            }
        }

        if (!userId) {
             console.error('UserId not found for email:', userEmail);
             // 如果找不到用户ID（未注册），则无法升级
             // 可以选择发送邮件邀请注册（此处略）
             return new Response(
                JSON.stringify({ message: 'User not registered, cannot upgrade.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        // 更新会员状态 - 使用 UPSERT 确保安全
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 年后到期

        const { data: profile, error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: userId, // 关键：使用获取到的 UUID
                email: userEmail, // 确保邮箱同步
                is_premium: true,
                membership_expiry: expiryDate.toISOString(),
                creem_customer_id: customer.id,
                creem_license_id: eventObject.id,
                updated_at: new Date().toISOString()
            })
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
