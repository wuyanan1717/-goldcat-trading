
export default async function handler(request, response) {
    // Hardcoded fallbacks for production hotfix
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://aaimrvqgroecgqtmmkzi.supabase.co';
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhaW1ydnFncm9lY2dxdG1ta3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTMzNzksImV4cCI6MjA3OTU2OTM3OX0.zp0DRBeQiWWpj-EQM3QMa01Fjvbcu0eL8F1-pd6UmFM';
    const BASE_URL = `${SUPABASE_URL}/functions/v1/market-proxy`;

    const { endpoint, symbol, interval, limit, marketType } = request.query;

    if (!symbol) {
        return response.status(400).json({ error: 'Missing symbol' });
    }

    const url = `${BASE_URL}?endpoint=${endpoint || 'klines'}&symbol=${symbol}&interval=${interval || '1h'}&limit=${limit || '50'}&marketType=${marketType || 'spot'}`;

    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('Supabase Proxy Error:', res.status, text);
            return response.status(res.status).json({ error: `Supabase Error: ${res.status}`, details: text });
        }

        const data = await res.json();
        return response.status(200).json(data);
    } catch (error) {
        console.error('Relay Error:', error);
        return response.status(500).json({ error: 'Relay Failed', details: error.message });
    }
}
