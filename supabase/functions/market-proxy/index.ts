
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BINANCE_SPOT_URL = 'https://api.binance.com/api/v3';
const BINANCE_FUTURES_URL = 'https://fapi.binance.com/fapi/v1';

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
        const marketType = url.searchParams.get('marketType') || 'spot'; // 'spot' or 'futures'

        if (!endpoint || !symbol) {
            return new Response(JSON.stringify({ error: 'Missing endpoint or symbol' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Select Base URL
        const baseUrl = marketType === 'futures' ? BINANCE_FUTURES_URL : BINANCE_SPOT_URL;

        // 3. Construct Binance URL
        // Example: https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1h&limit=50
        const targetUrl = `${baseUrl}/${endpoint}?symbol=${symbol}&interval=${interval}&limit=${limit}`;

        console.log(`[Proxy] Forwarding to (${marketType}): ${targetUrl}`);


        // 4. Fetch from Binance (Server-to-Server, no CORS/GFW issues)
        const response = await fetch(targetUrl);

        if (!response.ok) {
            console.error(`[Proxy] Binance API Error: ${response.status} ${response.statusText}`);
            // If it's a 400 bad request (likely symbol not found), pass it through so client knows
            // But return 200 OK to client with error payload so client can parse JSON easily
            if (response.status === 400) {
                return new Response(JSON.stringify({ error: 'INVALID_SYMBOL_OR_PARAM', details: response.statusText }), {
                    status: 200, // Return 200 but with error field
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({ error: `Binance Error: ${response.statusText}` }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const data = await response.json();

        // 5. Return data to frontend
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
