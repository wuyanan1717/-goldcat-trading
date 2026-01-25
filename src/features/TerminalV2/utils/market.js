import { calculateRSI } from './indicators';

// Use Supabase Proxy to bypass GFW and IP restrictions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BASE_URL = `${SUPABASE_URL}/functions/v1/market-proxy`;

export async function fetchBinanceKlines(symbol, interval, limit = 50) {
    // Internal helper to fetch from proxy
    const fetchFromProxy = async (marketType) => {
        const fetchLimit = limit + 15;
        const url = `${BASE_URL}?endpoint=klines&symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${fetchLimit}&marketType=${marketType}`;

        // Add timeout for mobile networks (15s)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            return json;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Network timeout - connection too slow');
            }
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
            // 2. Fallback to FUTURES
            try {
                rawData = await fetchFromProxy('futures');
                usedMarket = 'futures';
            } catch (futuresError) {
                // 3. Last Resort: Try adding "1000" prefix for Futures (common for meme coins/low price assets)
                // e.g. PEPE -> 1000PEPE, DOGS -> 1000DOGS
                if (!symbol.startsWith('1000')) {
                    try {
                        console.warn(`[Market] Futures failed for ${symbol}, trying 1000${symbol}...`);
                        // Temporarily change symbol to 1000 prefix for this call
                        const fetchLimit = limit + 15;
                        const prefixSymbol = `1000${symbol}`;
                        const url = `${BASE_URL}?endpoint=klines&symbol=${prefixSymbol.toUpperCase()}&interval=${interval}&limit=${fetchLimit}&marketType=futures`;

                        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
                        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
                        const json = await res.json();
                        if (json.error) throw new Error(json.error);

                        rawData = json;
                        usedMarket = 'futures';
                        // Note: We don't update the 'symbol' variable itself, so the chart title remains what user typed,
                        // but the data comes from the 1000-prefix contract.
                    } catch (prefixError) {
                        console.error(`[Market] 1000-prefix fallback also failed for ${symbol}`, prefixError);
                        throw spotError; // Throw original error if everything fails
                    }
                } else {
                    console.error(`[Market] Futures API also failed for ${symbol}`, futuresError);
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
