import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

console.log("Hello from binance-proxy (Supabase Edge Function)!");

serve(async (req) => {
    const requestOrigin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(requestOrigin);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const endpoint = url.searchParams.get("endpoint") || "klines";
        const symbol = url.searchParams.get("symbol");
        const interval = url.searchParams.get("interval") || "1h";
        const limit = url.searchParams.get("limit") || "50";
        const marketType = url.searchParams.get("marketType") || "spot"; // spot | futures

        if (!symbol) {
            return new Response(JSON.stringify({ error: "Missing symbol" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // URL Selection
        let targetBase = "https://api.binance.com/api/v3";
        if (marketType === "futures") {
            targetBase = "https://fapi.binance.com/fapi/v1";
        }

        const targetUrl = `${targetBase}/${endpoint}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        console.log(`[Binance Proxy] Proxying to: ${targetUrl}`);

        const response = await fetch(targetUrl);

        if (!response.ok) {
            const text = await response.text();
            console.error(`[Binance Proxy] Upstream Error: ${response.status} ${text}`);
            return new Response(JSON.stringify({ error: `Binance Error: ${response.status}`, details: text }), {
                status: response.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error(`[Binance Proxy] Internal Error:`, error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
