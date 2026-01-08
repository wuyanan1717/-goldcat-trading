import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from "../_shared/cors.ts";

console.log("Hello from cryptopanic-proxy (RSS + Analyst AI Version + i18n)!");

serve(async (req) => {
    const requestOrigin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(requestOrigin);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Authentication Check
        const authClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        const CRYPTOPANIC_API_KEY = Deno.env.get("CRYPTOPANIC_API_KEY");
        const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");

        // --- CACHE CHECK (30 Minutes for News) ---
        const supabaseUrlDB = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const adminClient = createClient(supabaseUrlDB, supabaseServiceKey);

        const url = new URL(req.url);
        const lang = url.searchParams.get("lang") || "zh";
        const safeLang = (lang === 'en' || lang === 'zh') ? lang : 'zh';
        const cacheCategory = 'cryptopanic_hot';

        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

        const { data: cachedData } = await adminClient
            .from('daily_briefs')
            .select('*')
            .eq('category', cacheCategory)
            .eq('lang', safeLang)
            .gt('created_at', thirtyMinsAgo)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (cachedData && cachedData.content) {
            console.log(`[CACHE HIT] Serving cached news for ${safeLang}`);
            return new Response(JSON.stringify({
                source: 'Database Cache',
                lang: safeLang,
                count: cachedData.content.length,
                results: cachedData.content
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        console.log(`[CACHE MISS] Fetching fresh news for ${safeLang}`);

        // RATE LIMIT CHECK ON CACHE MISS (Critical Cost Control)
        const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const { count: recentGenCount } = await adminClient
            .from('daily_briefs')
            .select('*', { count: 'exact', head: true })
            .eq('category', cacheCategory)
            .gt('created_at', oneMinAgo);

        if (recentGenCount && recentGenCount > 5) {
            return new Response(JSON.stringify({ error: 'System busy, please try again in a minute' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 429,
            });
        }

        // 1. Fetch RSS Feed
        let rssUrl = "https://cryptopanic.com/news/rss/";
        if (CRYPTOPANIC_API_KEY) {
            rssUrl += `?auth_token=${CRYPTOPANIC_API_KEY}&filter=hot`;
        } else {
            rssUrl += `?filter=hot`;
        }

        console.log("Fetching RSS from:", rssUrl);

        const response = await fetch(rssUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });

        if (!response.ok) {
            throw new Error(`RSA Fetch Failed: ${response.status} ${response.statusText}`);
        }

        const xmlText = await response.text();

        // 2. Parse RSS Items
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xmlText)) !== null) {
            const itemContent = match[1];

            const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemContent.match(/<title>(.*?)<\/title>/);
            let title = titleMatch ? titleMatch[1] : "No Title";

            let source = "CryptoPanic";
            const splitTitle = title.split(" \u2013 ");
            if (splitTitle.length > 1) {
                const lastPart = splitTitle[splitTitle.length - 1];
                if (lastPart.trim().startsWith("By ")) {
                    source = lastPart.replace("By ", "").trim();
                    title = splitTitle.slice(0, -1).join(" \u2013 ");
                }
            }

            const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
            const link = linkMatch ? linkMatch[1] : "#";

            const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
            const pubDate = dateMatch ? dateMatch[1] : new Date().toISOString();

            // EXTRACT DESCRIPTION FOR AI CONTEXT
            const descMatch = itemContent.match(/<description>(.*?)<\/description>/);
            let description = descMatch ? descMatch[1] : "";
            // Clean description (remove html tags)
            description = description.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();

            title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

            // Skip items without valid titles
            const cleanTitle = title.trim();
            const isInvalidTitle =
                !cleanTitle ||
                cleanTitle === "No Title" ||
                cleanTitle.length < 15 ||
                cleanTitle.startsWith('@') ||
                cleanTitle.toLowerCase().includes('read more') ||
                /^[A-Z]{2,}:/.test(cleanTitle); // Skip items like "RT:", "LATEST:", etc.

            if (isInvalidTitle) {
                continue;
            }

            items.push({
                kind: "news",
                domain: "cryptopanic.com",
                source: { title: source, region: "en" },
                title: title,
                original_title: title,
                published_at: pubDate,
                url: link,
                description: description // Pass description for AI
            });
        });
        }

// 3. AI Translation & Summarization (Top 5 Items)
const topItems = items.slice(0, 5);

if (GOOGLE_API_KEY && topItems.length > 0) {
    try {
        // Parse params
        const url = new URL(req.url);
        const lang = url.searchParams.get("lang") || "zh";

        const titles = topItems.map(i => i.title);
        let instructions = "";

        if (lang === 'zh') {
            instructions = `
                    1. Read the Headline and the Description.
                    2. Translate the Headline to Chinese (Simplified).
                    3. Generate a "Deep Analyst Take" (2-3 sentences) in Chinese (Simplified). Use the Description to add depth, context, and why this matters for the market. Avoid generic statements.
                    4. Combine into format: "[Translated Title]\\n💡 [Deep Analyst Take]" (No country flags).
                    `;
        } else {
            instructions = `
                    1. Read the Headline and the Description.
                    2. Generate a "Deep Analyst Take" (2-3 sentences) in English. Use the Description to add depth, context, and why this matters for the market. Avoid generic statements.
                    3. Combine into format: "[Headline (keep english)]\\n💡 [Deep Analyst Take]" (No country flags).
                    `;
        }

        const promptText = `
                You are a professional senior crypto analyst.
                For each of the following news headlines:
                ${instructions}
                
                Return ONLY a JSON array of strings, ensuring the order matches the input.
                
                Headlines & Context:
                ${JSON.stringify(topItems.map(i => ({ title: i.title, description: i.description || "" })))}
                `;

        // Using gemini-2.0-flash as confirmed by ListModels
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

        const aiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GOOGLE_API_KEY!
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: promptText
                    }]
                }]
            })
        });

        if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            throw new Error(`Gemini API Error: ${aiResponse.status} ${errText}`);
        }

        const result = await aiResponse.json();
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (textResponse) {
            // Robust JSON Parsing: Find first [ and last ]
            const start = textResponse.indexOf('[');
            const end = textResponse.lastIndexOf(']');

            if (start !== -1 && end !== -1) {
                const jsonStr = textResponse.substring(start, end + 1);
                try {
                    const translations = JSON.parse(jsonStr);
                    if (Array.isArray(translations) && translations.length === topItems.length) {
                        topItems.forEach((item, index) => {
                            item.title = translations[index];
                        });
                    }
                } catch (e) {
                    console.error("JSON Parse Error:", e);
                }
            }
        }
    } catch (aiError) {
        console.error("AI Translation Failed:", aiError);
    }
}

const jsonResponse = {
    count: items.length,
    next: null,
    previous: null,
    results: items // Return all items, top 5 translated
};

// --- SAVE TO CACHE ---
if (items.length > 0) {
    await adminClient.from('daily_briefs').insert({
        category: cacheCategory,
        lang: safeLang,
        content: items // Store the full processed list
    });
}

return new Response(JSON.stringify(jsonResponse), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
});

    } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
    });
}
});
