export function runBacktestSimulation(d1m, d5m, d1h) {
    let totalReturn = 0;

    let longWins = 0;
    let longLosses = 0;

    let shortWins = 0;
    let shortLosses = 0;

    const logs = [];

    // Helper to find candle at specific time
    const findCandle = (data, time) => {
        return data.find(d => d.time && d.time <= time && d.time + (getIntervalMs(data) - 1) >= time);
    };

    const getIntervalMs = (data) => {
        if (data.length < 2) return 60000;
        return (data[1].time || 0) - (data[0].time || 0);
    };

    // Logic: Iterate history
    for (let i = 60; i < d1m.length - 15; i++) {
        const candle1m = d1m[i];
        if (!candle1m.time) continue;

        const candle5m = findCandle(d5m, candle1m.time);
        const candle1h = findCandle(d1h, candle1m.time);

        if (!candle5m || !candle1h) continue;

        const prev1m = d1m[i - 5];
        const prev5m = d5m[d5m.indexOf(candle5m) - 1];
        const prev1h = d1h[d1h.indexOf(candle1h) - 1];

        if (!prev1m || !prev5m || !prev1h) continue;

        // --- Trend Definitions ---
        // Up Trend (Ascension)
        const isUp1m = candle1m.v > prev1m.v;
        const isUp5m = candle5m.v > prev5m.v;
        const isUp1h = candle1h.v > prev1h.v;

        // Down Trend (Collapse)
        const isDown1m = candle1m.v < prev1m.v;
        const isDown5m = candle5m.v < prev5m.v;
        const isDown1h = candle1h.v < prev1h.v;

        const entryPrice = candle1m.v;
        const exitPrice = d1m[i + 15].v; // Check result 15 mins later
        const rawPnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;

        // --- SIGNAL: LONG RESONANCE ---
        if (isUp1m && isUp5m && isUp1h) {
            // Long Logic: Profit if price goes UP
            if (rawPnlPercent > 0.05) {
                longWins++;
                totalReturn += rawPnlPercent;
            } else if (rawPnlPercent < -0.05) {
                longLosses++;
                totalReturn += rawPnlPercent;
            }
        }

        // --- SIGNAL: SHORT RESONANCE (The Crash Detector) ---
        if (isDown1m && isDown5m && isDown1h) {
            // Short Logic: Profit if price goes DOWN (Entry > Exit)
            // Short PnL = (Entry - Exit) / Entry
            const shortPnl = -rawPnlPercent; // Invert the PnL

            if (shortPnl > 0.05) {
                shortWins++;
                totalReturn += shortPnl;
            } else if (shortPnl < -0.05) {
                shortLosses++;
                totalReturn += shortPnl;
            }
        }
    }

    const calculateRate = (w, l) => {
        const t = w + l;
        return t === 0 ? 0 : (w / t) * 100;
    };

    const longRate = calculateRate(longWins, longLosses);
    const shortRate = calculateRate(shortWins, shortLosses);
    const totalSignals = longWins + longLosses + shortWins + shortLosses;

    logs.push(`扫描范围: 过去 ${d1m.length} 分钟`);
    logs.push(`--- 多头共振 (LONG) ---`);
    logs.push(`触发: ${longWins + longLosses} 次`);
    logs.push(`胜率: ${longRate.toFixed(1)}%`);
    logs.push(`--- 空头共振 (SHORT) ---`);
    logs.push(`触发: ${shortWins + shortLosses} 次`);
    logs.push(`胜率: ${shortRate.toFixed(1)}%`);
    logs.push(`-----------------------`);
    logs.push(`总净值: ${totalReturn.toFixed(2)}%`);

    return {
        totalSignals,
        longStats: { wins: longWins, losses: longLosses, rate: longRate },
        shortStats: { wins: shortWins, losses: shortLosses, rate: shortRate },
        totalReturn,
        logs
    };
}
