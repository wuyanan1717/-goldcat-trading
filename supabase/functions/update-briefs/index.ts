import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from "../_shared/cors.ts"

// --- TYPES & DATA ---
type KolCategory = "airdrop_hunters" | "treasure_hunters" | "traders" | "onchain_alpha" | "onchain_data";
type LangCode = "zh" | "en";

const CATEGORIES: KolCategory[] = ["airdrop_hunters", "traders", "treasure_hunters", "onchain_data"]; // Removed onchain_alpha
const LANGUAGES: LangCode[] = ["zh", "en"];

// --- HELPER: Call kol-proxy for one category/lang ---
async function fetchFromKolProxy(supabaseUrl: string, serviceKey: string, category: KolCategory, lang: LangCode): Promise<any> {
    const url = `${supabaseUrl}/functions/v1/kol-proxy`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({ category, lang })
    });

    if (!response.ok) {
        throw new Error(`kol-proxy returned ${response.status}`);
    }

    return await response.json();
}

// --- WORKER LOGIC ---
serve(async (req: Request) => {
    // 0. Debug Check (GET)
    if (req.method === 'GET') {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { count } = await supabase.from('daily_briefs').select('*', { count: 'exact', head: true });
        const { data } = await supabase.from('daily_briefs').select('category, lang, created_at, content').order('created_at', { ascending: false }).limit(5);

        return new Response(JSON.stringify({
            status: 'ok',
            count,
            latest: data,
            message: "DB Status Check"
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("[WORKER] Starting Briefs Update Job...");

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Secrets (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const results: any[] = [];

        // Correctly process all valid categories
        const categoriesToProcess = CATEGORIES;

        for (const lang of LANGUAGES) {
            const promises = categoriesToProcess.map(async (category) => {
                console.log(`[WORKER] Fetching ${category}/${lang} via kol-proxy...`);
                try {
                    const kolData = await fetchFromKolProxy(supabaseUrl, supabaseKey, category, lang);

                    // kol-proxy returns { source, lang, data, meta }
                    if (kolData.data && kolData.data.length > 0) {
                        // Save to database
                        const { error } = await supabase.from('daily_briefs').insert({
                            category,
                            lang,
                            content: kolData.data
                        });

                        if (error) {
                            console.error(`[DB] Insert error for ${category}/${lang}:`, error);
                            return { category, lang, status: 'db_error', error: error.message };
                        } else {
                            console.log(`[DB] Saved ${kolData.data.length} items for ${category}/${lang}`);
                            return { category, lang, status: 'success', count: kolData.data.length };
                        }
                    } else {
                        console.log(`[WORKER] No data from kol-proxy for ${category}/${lang}`);
                        return { category, lang, status: 'no_data', source: kolData.source };
                    }

                } catch (error: any) {
                    console.error(`[WORKER] Error fetching ${category}/${lang}:`, error.message);
                    return { category, lang, status: 'error', error: error.message };
                }
            });

            const langResults = await Promise.all(promises);
            results.push(...langResults);
        }

        console.log(`[WORKER] Job Complete.`);

        return new Response(JSON.stringify({
            status: 'complete',
            details: results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("[WORKER] Job Failed", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
