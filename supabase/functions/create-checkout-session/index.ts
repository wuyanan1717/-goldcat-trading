import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { productId, email, successUrl } = await req.json()

        if (!productId || !email) {
            throw new Error('Missing productId or email')
        }

        const creemApiKey = Deno.env.get('CREEM_API_KEY')
        if (!creemApiKey) {
            throw new Error('CREEM_API_KEY not set in environment variables')
        }

        console.log(`Creating checkout session for ${email} with product ${productId}`)

        const response = await fetch('https://api.creem.io/v1/checkouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': creemApiKey,
            },
            body: JSON.stringify({
                product_id: productId,
                customer: {
                    email: email
                },
                success_url: successUrl || 'http://localhost:5173', // Default to localhost if not provided
                metadata: {
                    source: 'goldcat_app'
                }
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Creem API Error:', data)
            throw new Error(data.message || 'Failed to create checkout session')
        }

        console.log('Checkout session created:', data.id)

        return new Response(
            JSON.stringify({ checkout_url: data.checkout_url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
