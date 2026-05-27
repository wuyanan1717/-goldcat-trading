export const calculateRisk = (formData, totalCapital, t) => {
    let rrRatio = 0;
    let positionSize = 0;
    let riskPercent = 0;
    let accountRiskPercent = 0;
    let riskAmount = 0;
    let valid = false;
    let errors = { stopLoss: '', takeProfit: '' };

    const margin = parseFloat(formData.margin);
    const leverage = parseFloat(formData.leverage);
    const entry = parseFloat(formData.entryPrice);
    const stop = parseFloat(formData.stopLoss);
    const take = parseFloat(formData.takeProfit);

    if (margin > 0 && leverage > 0 && entry > 0) {
        positionSize = margin * leverage;
        const isLong = formData.tradeType === 'buy';

        // 计算爆仓风险 / 单笔风控
        if (stop > 0) {
            const riskPriceDiff = Math.abs(entry - stop);
            riskPercent = parseFloat(((riskPriceDiff / entry) * leverage * 100).toFixed(2));
            
            riskAmount = (riskPriceDiff / entry) * positionSize;
            if (totalCapital > 0) {
                const rawPercent = (riskAmount / totalCapital) * 100;
                accountRiskPercent = parseFloat(rawPercent.toFixed(2));
            }
        }

        // 计算盈亏比 (Entry + SL + TP)
        if (stop > 0 && take > 0) {
            let risk = 0;
            let reward = 0;
            let isValidLogic = false;

            if (isLong) {
                if (stop >= entry) errors.stopLoss = t ? t('validation.long_sl') : 'Stop Loss must be below Entry';
                if (take <= entry) errors.takeProfit = t ? t('validation.long_tp') : 'Take Profit must be above Entry';

                if (stop < entry && take > entry) {
                    risk = entry - stop;
                    reward = take - entry;
                    isValidLogic = true;
                }
            } else {
                if (stop <= entry) errors.stopLoss = t ? t('validation.short_sl') : 'Stop Loss must be above Entry';
                if (take >= entry) errors.takeProfit = t ? t('validation.short_tp') : 'Take Profit must be below Entry';

                if (stop > entry && take < entry) {
                    risk = stop - entry;
                    reward = entry - take;
                    isValidLogic = true;
                }
            }

            if (isValidLogic && risk > 0) {
                rrRatio = parseFloat((reward / risk).toFixed(2));
                valid = true;
            }
        }
    }

    return {
        analysis: { rrRatio, positionSize, riskPercent, accountRiskPercent, riskAmount, valid },
        errors
    };
};

export const analyzeTradingPairRisk = (symbol, trades) => {
    if (!symbol || !trades) return null;

    const pairTrades = trades.filter(t => t.symbol === symbol && t.status === 'closed');
    if (pairTrades.length === 0) return null;

    const today = new Date().toDateString();
    
    const todayLosses = pairTrades.filter(t => {
        const tradeDate = new Date(t.createdAt || t.timestamp).toDateString();
        return tradeDate === today && (t.profitLoss || 0) < 0;
    }).length;

    const totalTrades = pairTrades.length;
    const losses = pairTrades.filter(t => (t.profitLoss || 0) < 0).length;
    const lossRate = totalTrades > 0 ? (losses / totalTrades) : 0;

    return {
        todayLosses,
        totalTrades,
        lossRate,
        showDailyWarning: todayLosses >= 2,
        showHistoricalWarning: totalTrades >= 5 && lossRate > 0.8
    };
};
