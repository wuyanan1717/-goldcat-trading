import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from "../_shared/cors.ts"

// Define types for strict safety
type KolCategory = "airdrop_hunters" | "treasure_hunters" | "traders" | "onchain_alpha" | "onchain_data";
type LangCode = "zh" | "en";

interface KolDbStructure {
    [key: string]: {
        [key in KolCategory]: string[];
    };
}

// Hardcoded KOL List for Backend (Source of Truth)
const KOL_DB: KolDbStructure = {
    zh: {
        airdrop_hunters: [
            "0xSunNFT", "ai_9684xtpa", "EmberCN", "YSI_crypto", "Bit wux", "hexiecs", "BTCwukong", "BensonTWN"
        ],
        treasure_hunters: [
            "jason_chen998", "Loki_Zeng", "BTCdayu", "web3annie", "Guilin_Chen_", "Dp520888", "UnicornBitcoin", "roger9949"
        ],
        traders: [
            "Phyrex_Ni", "TechFlowPost", "wublockchain12", "RonanFury", "laofeiyyds"
        ],
        onchain_alpha: [
            "ai_9684xtpa", "EmberCN", "BlockBeatsAsia", "BitWu2025", "OdailyChina"
        ],
        onchain_data: [
            "okxchinese", "binance_zh", "Foresight_News", "BlockBeatsAsia", "OdailyChina"
        ]
    },
    en: {
        airdrop_hunters: [
            "DeFiIgnas", "milesdeutscher", "LarkDavis", "AltcoinDaily", "JamesWynnReal", "Mrcryptoxwhale", "TedPillows"
        ],
        treasure_hunters: [
            "VitalikButerin", "cz_binance", "brian_armstrong", "ErikVoorhees", "SebastienGllmt", "JamesWynnReal", "hosseeb"
        ],
        traders: [
            "ITC_Crypto", "100trillionUSD", "CryptoHayes", "saylor", "APompliano", "CryptoTice_"
        ],
        onchain_alpha: [
            "zachxbt", "lookonchain", "laurashin", "Cointelegraph"
        ],
        onchain_data: [
            "glassnode", "santimentfeed", "whale_alert", "PeckShieldAlert", "DuneAnalytics"
        ]
    }
};

const RSSHUB_INSTANCE = "https://rsshub-wuffett.zeabur.app";

serve(async (req: Request) => {
    const requestOrigin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(requestOrigin);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const logs: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        logs.push(msg);
    };

    try {
        log("[Start] Request received");

        // 1. SETUP SUPABASE WITH ADMIN PRIVILEGES
        // Critical: Must use SERVICE_ROLE_KEY to write to DB
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
            log("WARNING: SUPABASE_SERVICE_ROLE_KEY is missing! Writes might fail.");
        }

        // 2. Parse Request
        const body = await req.json().catch(() => ({}));
        const { category, lang = 'zh' } = body;
        const safeLang = (lang === 'en' || lang === 'zh') ? lang : 'zh';

        log(`Param: category=${category}, lang=${safeLang}`);

        if (!category || !KOL_DB[safeLang][category as KolCategory]) {
            throw new Error(`Invalid category: ${category}`);
        }

        const accounts = KOL_DB[safeLang][category as KolCategory];
        // Select top 10 accounts to scan
        const targets = accounts.slice(0, 10);
        log(`Scanning ${targets.length} accounts: ${targets.join(', ')}`);

        // 3. FETCH RSS (RSSHub)
        const fetchPromises = targets.map(async (account) => {
            const rssUrl = `${RSSHUB_INSTANCE}/twitter/user/${account}?excludeReplies=true&t=${Date.now()}`;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

                const res = await fetch(rssUrl, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!res.ok) {
                    // log(`RSS Fail ${account}: ${res.status}`);
                    return [];
                }

                const text = await res.text();
                const items = [];
                const itemRegex = /<item>[\s\S]*?<\/item>/g;
                const matches = text.match(itemRegex);

                if (matches) {
                    matches.slice(0, 2).forEach(itemBlock => {
                        const titleMatch = itemBlock.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemBlock.match(/<title>(.*?)<\/title>/);
                        const descMatch = itemBlock.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
                        const linkMatch = itemBlock.match(/<link>(.*?)<\/link>/);

                        let content = descMatch ? descMatch[1] : (titleMatch ? titleMatch[1] : "");
                        content = content.replace(/<[^>]*>?/gm, '').trim(); // Strip HTML
                        content = content.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

                        const tweetLink = linkMatch ? linkMatch[1] : `https://x.com/${account}`;
                        if (content.length > 20) {
                            items.push({ author: account, content, raw: content, link: tweetLink });
                        }
                    });
                }

                // log(`Fetched ${items.length} items from ${account}`);
                return items;
            } catch (err) {
                // log(`Error ${account}: ${err.message}`);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);
        let rawCandidates = results.flat();

        // Deduplicate
        const uniqueSet = new Set();
        rawCandidates = rawCandidates.filter(item => {
            const isDuplicate = uniqueSet.has(item.content);
            uniqueSet.add(item.content);
            return !isDuplicate;
        });

        log(`Total unique items found: ${rawCandidates.length}`);

        if (rawCandidates.length === 0) {
            log("WARNING: No items found from any source.");
            return new Response(JSON.stringify({
                source: 'Live (Empty)',
                lang: safeLang,
                data: [],
                logs,
                dataLength: 0
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // 4. AI PROCESSING
        let aiContent = [];
        const apiKey = Deno.env.get('GOOGLE_API_KEY');

        if (!apiKey) {
            log("Missing Gemini API Key. Using raw fallback.");
        } else {
            log("Invoking Gemini AI...");
            const prompt = `
            You are a senior crypto analyst.
            Task: Review these ${rawCandidates.length} raw social media posts and extract the Top 5 High-Alpha items.
            
            Rules:
            1. FILTER: STRICTLY remove ads, spam, "GM/GN", price alerts without logic, and vague comments.
            2. SELECT: Pick exactly 5 items that contain NEWS, PROTOCOL UPGRADES, or SMART MONEY MOVES.
            3. SUMMARIZE: Summarize the core alpha in ${safeLang === 'zh' ? 'Simplified Chinese (Mandarin)' : 'English'}. Ensure the summary is comprehensive (around 2-3 sentences) and retains key details/numbers. 
            4. FORMAT: Return a raw JSON array of objects with keys: 'text' (the summary), 'source' (the author), and 'link' (the original tweet URL from input data).
            
            Raw Data:
            ${JSON.stringify(rawCandidates.slice(0, 30))}
            
            Output JSON Only:
            `;

            try {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                const aiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                const aiJson = await aiRes.json();
                const rawText = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;

                if (rawText) {
                    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                    aiContent = JSON.parse(cleanJson);
                    log(`AI generated ${aiContent.length} summaries`);
                } else {
                    log("AI returned no text");
                }
            } catch (e) {
                log(`AI Error: ${e.message}`);
            }
        }

        // Fallback
        if (aiContent.length === 0) {
            log("Using raw fallback (Top 5)");
            aiContent = rawCandidates.slice(0, 5).map(c => ({ text: c.content, source: c.author, link: c.link }));
        }

        // 5. SAVE TO DB
        if (aiContent.length > 0) {
            const { error: insertError } = await supabase.from('daily_briefs').insert({
                category,
                lang: safeLang,
                content: aiContent
            });

            if (insertError) {
                log(`DB INSERT ERROR: ${insertError.message}`);
            } else {
                log("Successfully saved to database.");
            }
        }

        return new Response(JSON.stringify({
            message: "Success",
            logs,
            dataLength: aiContent.length,
            data: aiContent
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err: any) {
        log(`FATAL ERROR: ${err.message}`);
        return new Response(JSON.stringify({ error: err.message, logs }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so logs are visible
        });
    }
});
