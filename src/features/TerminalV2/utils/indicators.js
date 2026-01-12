/**
 * Calculates RSI (Relative Strength Index) for an array of ChartData.
 * Typically requires at least 14 periods of prior data.
 */
export function calculateRSI(data, period = 14) {
    if (data.length < period + 1) return data;

    const results = [...data];
    let gains = 0;
    let losses = 0;

    // 1. Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const change = data[i].v - data[i - 1].v;
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // 2. Calculate RSI for the rest
    for (let i = period + 1; i < data.length; i++) {
        const change = data[i].v - data[i - 1].v;
        const currentGain = change > 0 ? change : 0;
        const currentLoss = change < 0 ? Math.abs(change) : 0;

        // Smoothed Moving Average
        avgGain = ((avgGain * (period - 1)) + currentGain) / period;
        avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;

        let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        let rsi = 100 - (100 / (1 + rs));

        results[i] = { ...results[i], rsi };
    }

    return results;
}

/**
 * Detects divergence between Price and RSI.
 */
export function detectDivergence(data) {
    if (data.length < 10) return 'NONE';

    // Simplified check on last 10 candles
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

/**
 * Detects "Flat Bottom Green" (平底绿) pattern.
 * Bullish Signal.
 */
export function detectFlatBottomGreen(data) {
    const indices = [];
    if (data.length < 2) return indices;

    for (let i = 1; i < data.length; i++) {
        const curr = data[i];
        const prev = data[i - 1];

        // 1. Must be Green
        const isGreen = curr.v > curr.o;
        if (!isGreen) continue;

        // 2. Flat Bottom (Open ~= Low)
        // Allow 0.02% tolerance for crypto volatility
        const isFlatBottom = Math.abs(curr.o - curr.l) / curr.v < 0.0002;

        // 3. Must have Upper Shadow
        const strictUpperShadow = curr.h > curr.v;

        // 4. Uptrend Context (Price > SMA7) - "上升趋势"
        // Replace strict "prev was red" with "general uptrend or higher low"
        // If we don't have enough data for SMA, we fallback to simple Higher Low check
        let isUptrend = false;
        if (i >= 7) {
            let sum = 0;
            for (let k = 0; k < 7; k++) {
                sum += data[i - k].v;
            }
            const sma7 = sum / 7;
            // Current price above 7-period average implies short-term uptrend
            isUptrend = curr.v > sma7;
        } else {
            // Fallback for beginning of array: Current Low >= Previous Low
            isUptrend = curr.l >= prev.l;
        }

        // 5. Volume Check (Volume > Prev Volume) - "配合交易量"
        // Relaxed volume check: Volume is above average OR greater than previous
        // Strict volume check might filter too many valid signals in crypto.
        // Let's keep the user's original implicit requirement (Volume Increase) or maybe refined:
        // Original: const volumeIncrease = curr.vol > prev.vol;
        // Let's stick to the existing volume logic for now unless requested, but the prompt focused on #4.
        const volumeIncrease = curr.vol > (prev.vol * 0.8); // Slightly relaxed: at least 80% of prev vol (avoid tiny vol) or strictly > prev? 
        // User didn't ask to change volume, so let's keep original strictly but maybe strict volume check excludes too many?
        // Let's keep strict > prev.vol as per original code, to ensure quality.
        const strictVolumeIncrease = curr.vol > prev.vol;

        if (isGreen && isFlatBottom && strictUpperShadow && isUptrend && strictVolumeIncrease) {
            indices.push(i);
        }
    }

    return indices;
}

/**
 * Detects "Beheading Red" (砍头红) pattern.
 * Bearish Signal.
 */
export function detectBeheadingRed(data) {
    const indices = [];
    if (data.length < 2) return indices;

    for (let i = 1; i < data.length; i++) {
        const curr = data[i];
        const prev = data[i - 1];

        // 1. Current must be Red (Close < Open)
        const isRed = curr.v < curr.o;
        if (!isRed) continue;

        // 2. Previous was a Doji (Small body relative to total range)
        const prevBody = Math.abs(prev.o - prev.v);
        const prevRange = prev.h - prev.l;
        // Body is less than 30% of the total range, implies indecision/Doji-like
        const isPrevDoji = prevRange > 0 && (prevBody / prevRange) < 0.35;

        if (!isPrevDoji) continue;

        // 3. "Beheading" - No Upper Shadow on the Red Candle
        // The high should be very close to the open.
        // Allow tiny tolerance (0.1% of body size)
        const upperShadow = curr.h - curr.o;
        const bodySize = curr.o - curr.v;
        const isShavenHead = upperShadow <= (bodySize * 0.1);

        // 4. "Long" Red Candle - Body should be significant (e.g., larger than prev doji range)
        const isBigDrop = bodySize > prevRange;

        // 5. Breaking Support - Close is lower than previous low
        const breaksSupport = curr.v < prev.l;

        if (isRed && isShavenHead && isBigDrop && breaksSupport) {
            indices.push(i);
        }
    }
    return indices;
}
