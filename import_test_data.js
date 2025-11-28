// 金猫系统 - 测试数据批量导入脚本
// 使用方法：
// 1. 打开网站，登录账号
// 2. 按 F12 打开控制台
// 3. 复制粘贴下面的代码并回车执行

const testTrades = [
    {
        date: '2024-11-01',
        symbol: 'BTC/USDT',
        tradeType: 'buy',
        margin: '100',
        leverage: '10',
        entryPrice: '65000',
        stopLoss: '64000',
        takeProfit: '67000',
        timeframe: '4h',
        pattern: '突破 (Breakout)',
        notes: '测试交易 - 趋势突破',
        status: 'closed',
        profitLoss: 150
    },
    {
        date: '2024-11-02',
        symbol: 'ETH/USDT',
        tradeType: 'sell',
        margin: '80',
        leverage: '5',
        entryPrice: '3500',
        stopLoss: '3600',
        takeProfit: '3300',
        timeframe: '1h',
        pattern: '回调 (Pullback)',
        notes: '测试交易 - 空头回调',
        status: 'closed',
        profitLoss: -40
    },
    {
        date: '2024-11-03',
        symbol: 'BTC/USDT',
        tradeType: 'buy',
        margin: '120',
        leverage: '10',
        entryPrice: '66000',
        stopLoss: '65000',
        takeProfit: '68000',
        timeframe: '4h',
        pattern: '趋势跟随 (Trend)',
        notes: '测试交易 - 趋势延续',
        status: 'closed',
        profitLoss: 200
    },
    {
        date: '2024-11-04',
        symbol: 'SOL/USDT',
        tradeType: 'buy',
        margin: '50',
        leverage: '10',
        entryPrice: '150',
        stopLoss: '145',
        takeProfit: '160',
        timeframe: '1h',
        pattern: '反转 (Reversal)',
        notes: '测试交易 - 底部反转',
        status: 'closed',
        profitLoss: 80
    },
    {
        date: '2024-11-05',
        symbol: 'BTC/USDT',
        tradeType: 'sell',
        margin: '100',
        leverage: '10',
        entryPrice: '67000',
        stopLoss: '68000',
        takeProfit: '65000',
        timeframe: '4h',
        pattern: '区间震荡 (Range)',
        notes: '测试交易 - 区间顶部做空',
        status: 'closed',
        profitLoss: -100
    },
    {
        date: '2024-11-06',
        symbol: 'ETH/USDT',
        tradeType: 'buy',
        margin: '90',
        leverage: '5',
        entryPrice: '3400',
        stopLoss: '3300',
        takeProfit: '3600',
        timeframe: '4h',
        pattern: '突破 (Breakout)',
        notes: '测试交易 - 上升突破',
        status: 'closed',
        profitLoss: 90
    },
    {
        date: '2024-11-07',
        symbol: 'BTC/USDT',
        tradeType: 'buy',
        margin: '150',
        leverage: '10',
        entryPrice: '68000',
        stopLoss: '67000',
        takeProfit: '70000',
        timeframe: '1d',
        pattern: '趋势跟随 (Trend)',
        notes: '测试交易 - 强势趋势',
        status: 'open',
        profitLoss: 0
    },
    {
        date: '2024-11-08',
        symbol: 'BNB/USDT',
        tradeType: 'buy',
        margin: '60',
        leverage: '10',
        entryPrice: '600',
        stopLoss: '590',
        takeProfit: '620',
        timeframe: '4h',
        pattern: '回调 (Pullback)',
        notes: '测试交易 - 回踩支撑',
        status: 'open',
        profitLoss: 0
    }
];

// 计算风控数据
function calculateRiskAnalysis(trade) {
    const entry = parseFloat(trade.entryPrice);
    const stop = parseFloat(trade.stopLoss);
    const take = parseFloat(trade.takeProfit);
    const margin = parseFloat(trade.margin);
    const leverage = parseFloat(trade.leverage);

    const isBuy = trade.tradeType === 'buy';
    const stopDist = Math.abs(entry - stop);
    const takeDist = Math.abs(take - entry);
    const positionSize = margin * leverage;
    const riskAmount = (stopDist / entry) * positionSize;
    const rewardAmount = (takeDist / entry) * positionSize;

    return {
        positionSize: positionSize.toFixed(2),
        riskAmount: riskAmount.toFixed(2),
        rewardAmount: rewardAmount.toFixed(2),
        riskPercent: ((riskAmount / margin) * 100).toFixed(2),
        rrRatio: (rewardAmount / riskAmount).toFixed(2),
        valid: true
    };
}

// 导入交易数据
function importTrades() {
    const userEmail = localStorage.getItem('goldcat_user')
        ? JSON.parse(localStorage.getItem('goldcat_user')).email
        : 'demo@goldcat.com';

    const existingTrades = JSON.parse(localStorage.getItem(`goldcat_trades_${userEmail}`)) || [];

    // 为每个交易添加ID和风控数据
    const formattedTrades = testTrades.map((trade, index) => ({
        id: Date.now() + index,
        ...trade,
        ...calculateRiskAnalysis(trade)
    }));

    // 合并数据
    const allTrades = [...formattedTrades, ...existingTrades];

    // 保存到 localStorage
    localStorage.setItem(`goldcat_trades_${userEmail}`, JSON.stringify(allTrades));

    console.log(`✅ 成功导入 ${testTrades.length} 条测试交易数据！`);
    console.log('📊 请刷新页面查看数据');

    return formattedTrades;
}

// 执行导入
importTrades();
