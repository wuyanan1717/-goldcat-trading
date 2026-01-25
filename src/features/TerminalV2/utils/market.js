import { calculateRSI } from './indicators';
import { addDebugLog } from './logger';

// Use Vercel Proxy (same origin) to bypass Mobile Carrier IP blocking to Supabase
const BASE_URL = '/api/market';

export async function fetchBinanceKlines(symbol, interval, limit = 50) {
    // Internal helper to fetch from proxy
    const fetchFromProxy = async (marketType) => {
        const fetchLimit = limit + 15;
        const url = `${BASE_URL}?endpoint=klines&symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${fetchLimit}&marketType=${marketType}`;

        // Add timeout for mobile networks (Aggressive 3s timeout to fail fast / switch to proxy)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

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

            const res = await fetch(url, {
                signal: controller.signal
            });
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

    // Optimized Concurrent Fetching Strategy (Race to Success)
    // launches multiple requests in parallel and returns the first successful one.
    // This avoids waiting for timeouts on blocked endpoints.

    // Helper to wrap promise with tagging
    const attempt = (promise, name) => promise.then(data => ({ status: 'fulfilled', data, name })).catch(error => ({ status: 'rejected', error, name }));

    try {
        addDebugLog(`Racing data sources for ${symbol}...`, 'info');

        // Create candidates array
        const candidates = [
            fetchFromProxy('spot'),
            fetchFromProxy('futures')
        ];

        // Add 1000-prefix candidate if applicable
        if (!symbol.startsWith('1000')) {
            // For 1000 prefix, we need to construct a specific fetch call
            // We reuse fetchFromProxy but we need to trick it or just call the url logic directly?
            // Since fetchFromProxy uses the 'symbol' from closure, we can't easily change it.
            // Let's just stick to Spot vs Futures race for now, which covers 90% of cases.
            // Simplicity is stability.
            // Actually, we can just instantiate the race.
        }

        // Implementation of Promise.any (First Success) logic
        // We race Spot and Futures. If both fail, we throw.

        // Note: To handle the 1000-prefix case elegantly without duplicating code,
        // lets just race Spot and Futures first. If both fail, THEN try 1000-futures (Edge case).
        // Racing 3 might trigger rate limits.

        try {
            const result = await Promise.any([
                fetchFromProxy('spot'),
                fetchFromProxy('futures')
            ]);

            // Validate result structure (Binance format check)
            if (!Array.isArray(result) || result.length === 0) throw new Error("Empty data");

            // Transform Data
            let charts = result.map((k, index) => ({
                i: index,
                v: parseFloat(k[4]), // Close price
                o: parseFloat(k[1]), // Open
                h: parseFloat(k[2]), // High
                l: parseFloat(k[3]), // Low
                vol: parseFloat(k[5]), // Volume
                time: k[0],
                label: new Date(k[0]).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            }));

            charts = calculateRSI(charts, 14);
            return charts.slice(-limit);

        } catch (raceError) {
            console.warn("Spot/Futures race failed, trying 1000-prefix fallback...", raceError);
            // Fallback: Try 1000-prefix Futures (Last Resort)
            if (!symbol.startsWith('1000')) {
                const fetchLimit = limit + 15;
                const prefixSymbol = `1000${symbol}`;
                const url = `${BASE_URL}?endpoint=klines&symbol=${prefixSymbol.toUpperCase()}&interval=${interval}&limit=${fetchLimit}&marketType=futures`;

                // Standalone fetch for fallback
                const res = await fetch(url);
                if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
                const json = await res.json();
                if (json.error) throw new Error(json.error);

                let charts = json.map((k, index) => ({
                    i: index,
                    v: parseFloat(k[4]),
                    o: parseFloat(k[1]),
                    h: parseFloat(k[2]),
                    l: parseFloat(k[3]),
                    vol: parseFloat(k[5]),
                    time: k[0],
                    label: new Date(k[0]).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                }));
                charts = calculateRSI(charts, 14);
                return charts.slice(-limit);
            }
            throw raceError;
        }

    } catch (error) {
        console.error("All market data fetches failed:", error);
        addDebugLog(`CRITICAL: All Sources Failed`, 'error');
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
