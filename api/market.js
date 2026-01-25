
export default async function handler(request, response) {
    const { endpoint, symbol, interval, limit, marketType } = request.query;

    if (!symbol) {
        return response.status(400).json({ error: 'Missing symbol' });
    }

    // Direct Binance URLs
    const BINANCE_SPOT_URL = 'https://api.binance.com/api/v3';
    const BINANCE_FUTURES_URL = 'https://fapi.binance.com/fapi/v1';
    // Public Data API (often has relaxed limiting/blocking for public data)
    const BINANCE_PUBLIC_SPOT_URL = 'https://data-api.binance.vision/api/v3';

    let baseUrl;
    if (marketType === 'futures') {
        baseUrl = BINANCE_FUTURES_URL;
    } else {
        baseUrl = BINANCE_SPOT_URL; // Try standard first
    }

    const constructUrl = (base) =>
        `${base}/${endpoint || 'klines'}?symbol=${symbol}&interval=${interval || '1h'}&limit=${limit || '50'}`;

    try {
        let targetUrl = constructUrl(baseUrl);
        console.log(`[Vercel Proxy] Fetching: ${targetUrl}`);

        let res = await fetch(targetUrl);

        // If standard Spot fails with 451/403, try Public Data API (Vision)
        if (!res.ok && (res.status === 451 || res.status === 403) && marketType !== 'futures') {
            console.log('[Vercel Proxy] Standard URL blocked. Retrying with Binance Vision...');
            targetUrl = constructUrl(BINANCE_PUBLIC_SPOT_URL);
            res = await fetch(targetUrl);
        }

        if (!res.ok) {
            const text = await res.text();
            console.error('Binance API Error:', res.status, text);
            return response.status(res.status).json({ error: `Binance Error: ${res.status}`, details: text });
        }

        const data = await res.json();
        return response.status(200).json(data);
    } catch (error) {
        console.error('Proxy Request Failed:', error);
        return response.status(500).json({ error: 'Proxy Request Failed', details: error.message });
    }
}
