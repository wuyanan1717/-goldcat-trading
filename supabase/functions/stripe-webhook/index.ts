
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

console.log("Stripe Webhook Function Initialized")

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
    try {
        const signature = req.headers.get('Stripe-Signature')

        if (!signature) {
            return new Response('No signature', { status: 400 })
        }

        const body = await req.text()
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

        let event
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                webhookSecret,
                undefined,
                cryptoProvider
            )
        } catch (err) {
            console.error(`Webhook signature verification failed: ${err.message}`)
            return new Response(err.message, { status: 400 })
        }

        console.log(`Received event: ${event.type}`)

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object
            const userEmail = session.customer_details?.email || session.customer_email

            console.log(`Processing premium upgrade for: ${userEmail}`)

            if (userEmail) {
                // Initialize Supabase Admin Client
                const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
                const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                const supabase = createClient(supabaseUrl, supabaseServiceKey)

                // 最小化更新，只设置会员状态，避免数据库字段缺失导致的报错
                const { error } = await supabase
                    .from('profiles')
                    .update({ is_premium: true })
                    .eq('email', userEmail)

                if (error) {
                    console.error('Failed to update profile:', error)
                    throw error
                }

                console.log(`Successfully upgraded user: ${userEmail}`)
            } else {
                console.error('No email found in session object')
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (err) {
        console.error(`Webhook Error: ${err.message}`)
        return new Response(err.message, { status: 400 })
    }
})
