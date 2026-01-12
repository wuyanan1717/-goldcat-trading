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
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        return json;
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
                console.error(`[Market] Futures API also failed for ${symbol}`, futuresError);
                throw spotError; // Throw original error if both fail
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
