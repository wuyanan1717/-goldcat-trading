
export function calculateRSI(data: any[], period = 14) {
    if (data.length < period + 1) return data;

    const results = [...data];
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = data[i].v - data[i - 1].v;
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < data.length; i++) {
        const change = data[i].v - data[i - 1].v;
        const currentGain = change > 0 ? change : 0;
        const currentLoss = change < 0 ? Math.abs(change) : 0;

        avgGain = ((avgGain * (period - 1)) + currentGain) / period;
        avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        results[i] = { ...results[i], rsi };
    }

    return results;
}

export function detectDivergence(data: any[]) {
    if (data.length < 10) return 'NONE';

    const recent = data.slice(-10);
    const start = recent[0];
    const end = recent[recent.length - 1];

    if (!start.rsi || !end.rsi) return 'NONE';

    const priceTrend = end.v > start.v ? 'UP' : 'DOWN';
    const rsiTrend = end.rsi > start.rsi ? 'UP' : 'DOWN';

    if (priceTrend === 'UP' && rsiTrend === 'DOWN') return 'BEARISH';
    if (priceTrend === 'DOWN' && rsiTrend === 'UP') return 'BULLISH';

    return 'NONE';
}
