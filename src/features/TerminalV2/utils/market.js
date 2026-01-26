import { calculateRSI } from './indicators';
import { addDebugLog } from './logger';

// Use Vercel Proxy (same origin) to bypass Mobile Carrier IP blocking to Supabase
const BASE_URL = '/api/market';

export async function fetchBinanceKlines(symbol, interval, limit = 50) {
    // Internal helper to fetch from proxy
    const fetchFromProxy = async (marketType) => {
        const fetchLimit = limit + 15;
        const url = `${BASE_URL}?endpoint=klines&symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${fetchLimit}&marketType=${marketType}`;

        // Add timeout for mobile networks (15s)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            // Import logger dynamically to avoid circular deps if any (though strict checking is better, dynamic is safer for quick patch)
            // But standard import is fine here since utils usually don't depend on components.
            // Let's use the window object if available or simple console for now, 
            // BUT wait, I should import it at the top. 
            // Since this is a replacement chunk, I need to add the import at the top too.
            // I'll do a separate edit for the import, or just Assume I will add it. 
            // For this chunk I'll use the imported function.

            /* Debug Log */
            // Note: I will add the import in a separate step or included in a full file replace? 
            // replace_file_content is better for small chunks. 
            // I'll use console.log which my logger hooks into? No, I want explicit logs.
            // I'll assume I'll add `import { addDebugLog } from './logger';` at the top.

            addDebugLog(`Fetching ${symbol} (${marketType})...`, 'info');

            // 1. Try Vercel Proxy (Primary)
            let res = null;
            let vercelFailed = false;

            try {
                res = await fetch(url, {
                    signal: controller.signal
                });
            } catch (e) {
                console.warn(`[Market] Vercel Network Error:`, e);
                vercelFailed = true;
            }

            // Check if blocked or failed
            if (!res || !res.ok) {
                // 2. Fallback Logic matches:
                // - Network Error (fetch threw exception)
                // - Any error on Futures (Binance Futures aggressively blocks IPs)
                // - Specific blocking codes on any market (403, 451, 500, 504)
                const isBlockedError = res && (res.status === 403 || res.status === 451 || res.status === 500 || res.status === 504);
                const isfuturesError = marketType === 'futures' && (!res || !res.ok);

                if (vercelFailed || isBlockedError || isfuturesError) {
                    console.warn(`[Market] Vercel Proxy failed/blocked, trying Supabase Proxy...`);
                    addDebugLog(`Vercel Fail, switching to Supabase...`, 'warning');

                    // RESET TIMEOUT for Fallback (give it 25s for potential Cold Start)
                    clearTimeout(timeoutId);
                    const sbController = new AbortController();
                    const sbTimeoutId = setTimeout(() => sbController.abort(), 25000);

                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    if (supabaseUrl) {
                        const sbUrl = `${supabaseUrl}/functions/v1/binance-proxy?endpoint=klines&symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${fetchLimit}&marketType=${marketType}`;
                        try {
                            const sbRes = await fetch(sbUrl, { signal: sbController.signal });
                            clearTimeout(sbTimeoutId);

                            if (sbRes.ok) {
                                res = sbRes;
                                addDebugLog(`Supabase Proxy Success`, 'success');
                            } else {
                                console.error(`[Market] Supabase Proxy also failed: ${sbRes.status} ${sbRes.statusText}`);
                            }
                        } catch (sbError) {
                            clearTimeout(sbTimeoutId);
                            console.error("[Market] Supabase Proxy network error (Timeout?)", sbError);
                        }
                    }
                }
            }

            // Clear original timeout if we didn't use fallback or fallback finished
            clearTimeout(timeoutId);

            if (!res) throw new Error('Network connection failed');

            clearTimeout(timeoutId);

            addDebugLog(`Status: ${res.status} ${res.statusText}`, res.ok ? 'success' : 'error');

            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
            const json = await res.json();
            if (json.error) throw new Error(json.error);

            addDebugLog(`Got ${json.length} candles`, 'success');
            return json;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                addDebugLog(`Timeout fetching ${symbol}`, 'error');
                throw new Error('Network timeout - connection too slow');
            }
            addDebugLog(`Fetch failed: ${error.message}`, 'error');
            throw error;
        }
    };

    try {
        let rawData;
        let usedMarket = 'spot';

        try {
            // 1. Try SPOT first
            rawData = await fetchFromProxy('spot');
        } catch (spotError) {
            console.warn(`[Market] Spot API failed for ${symbol}, trying FUTURES...`, spotError);
            addDebugLog(`Spot failed, trying Futures...`, 'warning');
            // 2. Fallback to FUTURES
            try {
                rawData = await fetchFromProxy('futures');
                usedMarket = 'futures';
            } catch (futuresError) {
                // 3. Last Resort: Try adding "1000" prefix for Futures
                if (!symbol.startsWith('1000')) {
                    try {
                        console.warn(`[Market] Futures failed for ${symbol}, trying 1000${symbol}...`);
                        addDebugLog(`Futures failed, trying 1000${symbol}...`, 'warning');

                        // Temporarily change symbol to 1000 prefix for this call
                        const fetchLimit = limit + 15;
                        const prefixSymbol = `1000${symbol}`;
                        const url = `${BASE_URL}?endpoint=klines&symbol=${prefixSymbol.toUpperCase()}&interval=${interval}&limit=${fetchLimit}&marketType=futures`;

                        const res = await fetch(url);
                        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
                        const json = await res.json();
                        if (json.error) throw new Error(json.error);

                        rawData = json;
                        usedMarket = 'futures';
                        addDebugLog(`1000-prefix success`, 'success');
                    } catch (prefixError) {
                        console.error(`[Market] 1000-prefix fallback also failed for ${symbol}`, prefixError);
                        addDebugLog(`All fallbacks failed for ${symbol}`, 'error');
                        throw spotError; // Throw original error if everything fails
                    }
                } else {
                    console.error(`[Market] Futures API also failed for ${symbol}`, futuresError);
                    addDebugLog(`Futures failed for ${symbol}`, 'error');
                    throw spotError;
                }
            }
        }

        // Transform Binance format [time, open, high, low, close, volume...]
        let charts = rawData.map((k, index) => ({
            i: index,
            v: parseFloat(k[4]), // Close price
            o: parseFloat(k[1]), // Open
            h: parseFloat(k[2]), // High
            l: parseFloat(k[3]), // Low
            vol: parseFloat(k[5]), // Volume
            time: k[0],
            label: new Date(k[0]).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }));

        // Calculate RSI
        charts = calculateRSI(charts, 14);

        // Return only the requested amount (cutting off the warmup period)
        return charts.slice(-limit);

    } catch (error) {
        console.error("Failed to fetch market data:", error);
        addDebugLog(`CRITICAL: ${error.message}`, 'error');
        // Do NOT return fake data. Throw error so UI shows "Load Failed"
        throw error;
    }
}

export async function fetchBacktestData(symbol) {
    const [d1m, d5m, d1h] = await Promise.all([
        fetchBinanceKlines(symbol, '1m', 1000),
        fetchBinanceKlines(symbol, '5m', 200),
        fetchBinanceKlines(symbol, '1h', 50)
    ]);
    return { d1m, d5m, d1h };
}

export function formatPrice(price) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}
