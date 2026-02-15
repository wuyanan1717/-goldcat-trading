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

        // 1. STRATEGY: API First -> Cointelegraph Fallback
        const items = [];
        let fetchSuccess = false;

        // --- ATTEMPT 1: CryptoPanic API (JSON) ---
        // Only if API Key is present (it's robust)
        if (CRYPTOPANIC_API_KEY) {
            try {
                console.log("Attempting CryptoPanic API...");
                const apiUrl = `https://cryptopanic.com/api/v1/posts/?auth_token=${CRYPTOPANIC_API_KEY}&filter=hot&public=true`;
                const resp = await fetch(apiUrl);

                if (resp.ok) {
                    const data = await resp.json();
                    if (data.results && Array.isArray(data.results)) {
                        console.log(`[API Hit] Fetched ${data.results.length} items from CryptoPanic API`);
                        data.results.forEach((post: any) => {
                            // Normalize API data to our structure
                            const title = post.title;
                            // Clean up source title (often "News.Bitcoin.com" etc)
                            let source = post.source?.title || "CryptoPanic";
                            const description = ""; // API listing often doesn't give full description without extra calls, or slug

                            if (title && title.length > 10) {
                                items.push({
                                    kind: "news",
                                    domain: post.domain || "cryptopanic.com",
                                    source: { title: source, region: "en" },
                                    title: title,
                                    original_title: title,
                                    published_at: post.published_at || new Date().toISOString(),
                                    url: post.url, // Usually a redirector
                                    description: description
                                });
                            }
                        });
                        fetchSuccess = true;
                    }
                } else {
                    console.warn(`CryptoPanic API failed: ${resp.status}`);
                }
            } catch (e) {
                console.error("CryptoPanic API Exception:", e);
            }
        }

        // --- ATTEMPT 2: Decrypt (Fallback) ---
        // If API failed or no key, or RSS feed blocked previously
        if (!fetchSuccess) {
            console.log("Falling back to Decrypt RSS...");
            try {
                const rssUrl = "https://decrypt.co/feed";
                const response = await fetch(rssUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
                    }
                });

                if (response.ok) {
                    const xmlText = await response.text();

                    // Regex Parse XML for resilience
                    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
                    let match;
                    while ((match = itemRegex.exec(xmlText)) !== null) {
                        const itemContent = match[1];

                        const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemContent.match(/<title>(.*?)<\/title>/);
                        let title = titleMatch ? titleMatch[1] : "";

                        const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
                        const link = linkMatch ? linkMatch[1] : "";

                        const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
                        const pubDate = dateMatch ? dateMatch[1] : new Date().toISOString();

                        // Description often has HTML
                        const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
                        let description = descMatch ? descMatch[1] : "";
                        description = description.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
                        // Decode HTML entities if any remaining
                        description = description.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'");

                        // Extract author if available (dc:creator)
                        const creatorMatch = itemContent.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/) || itemContent.match(/<dc:creator>(.*?)<\/dc:creator>/);
                        const author = creatorMatch ? creatorMatch[1] : "Decrypt";

                        if (title && link) {
                            items.push({
                                kind: "news",
                                domain: "decrypt.co",
                                source: { title: author, region: "en" },
                                title: title,
                                original_title: title,
                                published_at: pubDate,
                                url: link,
                                description: description
                            });
                        }
                    }
                    console.log(`[RSS Fallback] Fetched ${items.length} items from Decrypt`);
                    fetchSuccess = true;
                } else {
                    console.error(`Decrypt RSS failed: ${response.status}`);
                }
            } catch (e) {
                console.error("RSS Fallback Exception:", e);
            }
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
