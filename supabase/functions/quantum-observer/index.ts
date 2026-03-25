
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from "../_shared/cors.ts"
import { calculateRSI, detectDivergence } from "./utils.ts"

const BINANCE_SPOT_URL = 'https://api.binance.com/api/v3';
const BINANCE_FUTURES_URL = 'https://fapi.binance.com/fapi/v1';

serve(async (req) => {
    const requestOrigin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(requestOrigin);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        // 1. Auth Check (Require valid user)
        const authClient = createClient(
            supabaseUrl,
            supabaseAnonKey,
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )
        const { data: { user } } = await authClient.auth.getUser()

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

        // 2. Usage Limit Check
        const { data: profile } = await adminClient.from('profiles').select('is_premium').eq('id', user.id).single();
        const DAILY_LIMIT = profile?.is_premium ? 999 : 100; // Open version might have different limits

        const today = new Date().toISOString().split('T')[0];
        const { data: usageData } = await adminClient.from('daily_scan_counts').select('count').eq('user_id', user.id).eq('scan_date', today).single();
        const currentCount = usageData?.count || 0;

        if (currentCount >= DAILY_LIMIT) {
            return new Response(JSON.stringify({ error: 'Daily Limit Reached', limit: DAILY_LIMIT }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 429,
            })
        }

        // 3. Parameters
        const { symbol, marketType = 'spot', lang = 'zh' } = await req.json();
        if (!symbol) throw new Error('Missing symbol');

        const baseUrl = marketType === 'futures' ? BINANCE_FUTURES_URL : BINANCE_SPOT_URL;

        // 4. Fetch Market Data (1H, 5M, 1M)
        const fetchKlines = async (interval: string, limit: number) => {
            const url = `${baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Binance error: ${res.statusText}`);
            const raw = await res.json();
            return raw.map((item: any) => ({
                time: item[0],
                o: parseFloat(item[1]),
                h: parseFloat(item[2]),
                l: parseFloat(item[3]),
                v: parseFloat(item[4]), // Close
                vol: parseFloat(item[5])
            }));
        };

        const [raw1h, raw5m, raw1m] = await Promise.all([
            fetchKlines('1h', 60),
            fetchKlines('5m', 60),
            fetchKlines('1m', 60)
        ]);

        const data1h = calculateRSI(raw1h);
        const data5m = calculateRSI(raw5m);
        const data1m = calculateRSI(raw1m);

        // 5. Dimension Analysis (Reuse logic from observer.js)
        const analyzeDimension = (data: any[]) => {
            const start = data[0].v;
            const end = data[data.length - 1].v;
            const change = ((end - start) / start) * 100;
            const currentRSI = data[data.length - 1].rsi || 50;
            const mid = Math.floor(data.length / 2);
            const vol1 = data.slice(0, mid).reduce((a: any, b: any) => a + b.vol, 0) / mid;
            const vol2 = data.slice(mid).reduce((a: any, b: any) => a + b.vol, 0) / (data.length - mid);
            return {
                change: change.toFixed(2),
                trend: change > 0.05 ? "UP" : change < -0.05 ? "DOWN" : "FLAT",
                rsi: currentRSI.toFixed(1),
                volTrend: (vol2 - vol1) > 0 ? "EXPANDING" : "CONTRACTING",
                divergence: detectDivergence(data)
            };
        };

        const dim1h = analyzeDimension(data1h);
        const dim5m = analyzeDimension(data5m);
        const dim1m = analyzeDimension(data1m);
        const currentPrice = data1m[data1m.length - 1].v;

        // 6. Build Prompt
        const systemInstruction = `
            You are the "GoldCat Quantum Observer", a high-end AI market analyst.
            Your mission is to perform a cross-timeframe resonance analysis for the ${symbol} market.

            [Market Vectors]
            - Current Price: $${currentPrice}
            - 1H (Macro Horizon): Trend ${dim1h.trend}, RSI ${dim1h.rsi}, Change ${dim1h.change}%
            - 5M (Structural Flow): Trend ${dim5m.trend}, Divergence ${dim5m.divergence}
            - 1M (Micro Pulse): Trend ${dim1m.trend}, Volatility ${dim1m.volTrend}

            [System Directives]
            1. Synthesize the macro trend with micro movements to identify "Quantum Resonance" (convergence).
            2. If 1H and 5M trends align, increase signal strength.
            3. If RSI shows overbought (>70) or oversold (<30) conditions, factor in potential mean reversion.
            4. Detect RSI divergence for early reversal warnings.
            5. Return a strict JSON object (no markdown, no preamble).

            [Output Schema]
            {
              "probability_up": number (0-100, probability of price increase in the next 1-4 hours),
              "uncertainty": number (0-100, entropy level),
              "conclusion": string (Concise market state description in ${lang === 'en' ? 'English' : '中文'}),
              "quantum_phrase": string (Unique sci-fi technical term for the current state, e.g., "Bullish Singularity", "Entropy Flux"),
              "signal": "LONG" | "SHORT" | "WAIT",
              "action_advice": string (Specific, actionable trading advice in ${lang === 'en' ? 'English' : '中文'}),
              "support_price": number (Calculated critical support level near ${currentPrice}),
              "resistance_price": number (Calculated critical resistance level near ${currentPrice})
            }
        `;

        // 7. Call Gemini
        const apiKey = Deno.env.get('GOOGLE_API_KEY');
        const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey! },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemInstruction }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
            })
        });

        if (!geminiResponse.ok) throw new Error(`Gemini API error: ${await geminiResponse.text()}`);
        const geminiData = await geminiResponse.json();
        const aiText = geminiData.candidates[0].content.parts[0].text;
        
        // Extract JSON
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse AI response", raw: aiText };

        // 8. Increment usage count
        await adminClient.from('daily_scan_counts').upsert({
            user_id: user.id,
            scan_date: today,
            count: currentCount + 1,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, scan_date' });

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
