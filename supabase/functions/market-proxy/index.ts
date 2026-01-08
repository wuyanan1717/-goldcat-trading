
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // 1. Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const endpoint = url.searchParams.get('endpoint'); // e.g., 'klines'
        const symbol = url.searchParams.get('symbol');
        const interval = url.searchParams.get('interval');
        const limit = url.searchParams.get('limit') || '100';

        if (!endpoint || !symbol) {
            return new Response(JSON.stringify({ error: 'Missing endpoint or symbol' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Construct Binance URL
        // Example: https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=50
        const targetUrl = `${BINANCE_BASE_URL}/${endpoint}?symbol=${symbol}&interval=${interval}&limit=${limit}`;

        console.log(`[Proxy] Forwarding to: ${targetUrl}`);


        // 3. Fetch from Binance (Server-to-Server, no CORS/GFW issues)
        const response = await fetch(targetUrl);

        if (!response.ok) {
            console.error(`[Proxy] Binance API Error: ${response.status} ${response.statusText}`);
            return new Response(JSON.stringify({ error: `Binance Error: ${response.statusText}` }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const data = await response.json();

        // 4. Return data to frontend
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(`[Proxy] Internal Error:`, error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
