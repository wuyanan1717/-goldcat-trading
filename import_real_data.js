// 金猫系统 - 真实测试数据导入脚本 (基于您的截图)
// 使用方法：
// 1. 确保您已登录账号
// 2. 按 F12 打开控制台 (Console)
// 3. 复制以下所有代码
// 4. 粘贴到控制台并回车

const realTestTrades = [
    {
        date: '2024-03-01',
        symbol: 'SAND/USDT',
        tradeType: 'sell', // 做空
        margin: '100',
        leverage: '5',
        entryPrice: '0.6600', // 估算入场
        stopLoss: '0.6950',   // 截图数据
        takeProfit: '0.6280', // 截图数据
        timeframe: '1h',
        pattern: '趋势交易 (Trend)',
        notes: '1小时 关注趋势，可取 顶背离',
        status: 'closed',
        profitLoss: -35 // 亏损
    },
    {
        date: '2024-03-01',
        symbol: 'SAND/USDT',
        tradeType: 'buy', // 做多
        margin: '200',
        leverage: '2',
        entryPrice: '0.6000',
        stopLoss: '0.5800',
        takeProfit: '0.6500',
        timeframe: '1h',
        pattern: '趋势交易 (Trend)',
        notes: '1小时 关注趋势，可取 杀空单',
        status: 'closed',
        profitLoss: 45 // 盈利
    },
    {
        date: '2024-03-01',
        symbol: 'LTC/USDT',
        tradeType: 'buy', // 做多
        margin: '100',
        leverage: '5',
        entryPrice: '88.50',
        stopLoss: '85.00',
        takeProfit: '95.00',
        timeframe: '1h',
        pattern: '趋势交易 (Trend)',
        notes: '1小时 关注趋势，可取 消息面',
        status: 'closed',
        profitLoss: 120 // 盈利
    },
    {
        date: '2024-03-02',
        symbol: 'HOOK/USDT',
        tradeType: 'buy', // 做多
        margin: '100',
        leverage: '5',
        entryPrice: '1.1000',
        stopLoss: '1.0500',
        takeProfit: '1.2000',
        timeframe: '1h',
        pattern: '趋势交易 (Trend)',
        notes: '1小时 关注趋势，可取 趋势交易',
        status: 'closed',
        profitLoss: 80 // 盈利
    },
    {
        date: '2024-03-02',
        symbol: 'MAGIC/USDT',
        tradeType: 'buy', // 做多
        margin: '150',
        leverage: '5',
        entryPrice: '1.2500',
        stopLoss: '1.2000',
        takeProfit: '1.3500',
        timeframe: '1h',
        pattern: '趋势交易 (Trend)',
        notes: '1小时 关注趋势，可取 趋势交易 (后续快速上涨没有关注)',
        status: 'closed',
        profitLoss: 150 // 盈利
    },
    {
        date: '2024-03-02',
        symbol: 'FIL/USDT',
        tradeType: 'buy', // 做多
        margin: '300',
        leverage: '3',
        entryPrice: '9.500',
        stopLoss: '9.000',
        takeProfit: '10.500',
        timeframe: '1h',
        pattern: '趋势交易 (Trend)',
        notes: '1小时 关注趋势，可取 趋势交易 (完美交易)',
        status: 'closed',
        profitLoss: 200 // 盈利
    },
    {
        date: '2024-03-02',
        symbol: 'HIGH/USDT',
        tradeType: 'buy', // 做多
        margin: '100',
        leverage: '5',
        entryPrice: '2.800',
        stopLoss: '2.600',
        takeProfit: '3.200',
        timeframe: '1h',
        pattern: '消息面 (News)',
        notes: '1小时 关注趋势，可取 消息面',
        status: 'closed',
        profitLoss: 90 // 盈利
    },
    {
        date: '2024-03-02',
        symbol: 'SAND/USDT',
        tradeType: 'buy', // 做多
        margin: '100',
        leverage: '2',
        entryPrice: '0.6800',
        stopLoss: '0.6600',
        takeProfit: '0.7200',
        timeframe: '1h',
        pattern: '趋势交易 (Trend)',
        notes: '1小时 关注趋势，可取 打损单 (差一点到达止盈位)',
        status: 'closed',
        profitLoss: -20 // 亏损
    },
    {
        date: '2024-03-02',
        symbol: 'CRV/USDT',
        tradeType: 'buy', // 做多
        margin: '200',
        leverage: '2',
        entryPrice: '0.6800',
        stopLoss: '0.6500',
        takeProfit: '0.7500',
        timeframe: '1h',
        pattern: '支撑位 (Support)',
        notes: '1小时 关注趋势，可取 无脑做多 (支撑位挂单)',
        status: 'closed',
        profitLoss: 110 // 盈利
    },
    {
        date: '2024-03-02',
        symbol: 'CAKE/USDT',
        tradeType: 'sell', // 做空
        margin: '100',
        leverage: '3',
        entryPrice: '3.800',
        stopLoss: '4.000',
        takeProfit: '3.500',
        timeframe: '1h',
        pattern: '趋势交易 (Trend)',
        notes: '1小时 关注趋势，可取 追空单 (主观没问题)',
        status: 'closed',
        profitLoss: -50 // 亏损
    },
    {
        date: '2024-03-03',
        symbol: 'PEOPLE/USDT',
        tradeType: 'buy', // 做多
        margin: '100',
        leverage: '4',
        entryPrice: '0.04500',
        stopLoss: '0.04200',
        takeProfit: '0.05000',
        timeframe: '1h',
        pattern: '趋势交易 (Trend)',
        notes: '1小时 关注趋势，可取 趋势交易 (手动止盈在了最高点)',
        status: 'closed',
        profitLoss: 180 // 盈利
    },
    {
        date: '2024-03-03',
        symbol: 'LTC/USDT',
        tradeType: 'sell', // 做空
        margin: '150',
        leverage: '4',
        entryPrice: '90.00',
        stopLoss: '92.00',
        takeProfit: '85.00',
        timeframe: '1h',
        pattern: '趋势交易 (Trend)',
        notes: '1小时 关注趋势，可取 趋势交易 (4h收阴，有向下支撑迹象)',
        status: 'closed',
        profitLoss: -60 // 亏损
    }
];

// 辅助函数：计算风控数据
function calculateRiskAnalysis(trade) {
    const entry = parseFloat(trade.entryPrice);
    const stop = parseFloat(trade.stopLoss);
    const take = parseFloat(trade.takeProfit);
    const margin = parseFloat(trade.margin);
    const leverage = parseFloat(trade.leverage);

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
        rrRatio: riskAmount > 0 ? (rewardAmount / riskAmount).toFixed(2) : '0.00',
        valid: true
    };
}

// 主导入函数
function importRealData() {
    // 1. 获取当前登录用户
    const userStr = localStorage.getItem('goldcat_user');
    if (!userStr) {
        console.error('❌ 错误：请先登录账号！');
        alert('请先登录账号再运行此脚本！');
        return;
    }
    const user = JSON.parse(userStr);
    const userEmail = user.email;
    console.log(`👤 正在为用户 ${userEmail} 导入数据...`);

    // 2. 获取现有数据
    const storageKey = `goldcat_trades_${userEmail}`;
    const existingTrades = JSON.parse(localStorage.getItem(storageKey)) || [];

    // 3. 格式化新数据
    const newTrades = realTestTrades.map((trade, index) => ({
        id: Date.now() + index, // 生成唯一ID
        ...trade,
        ...calculateRiskAnalysis(trade) // 自动计算风控指标
    }));

    // 4. 合并并保存
    const allTrades = [...newTrades, ...existingTrades];
    localStorage.setItem(storageKey, JSON.stringify(allTrades));

    // 5. 成功提示
    console.log(`✅ 成功导入 ${newTrades.length} 条数据！`);
    console.log(`📊 当前总交易数：${allTrades.length}`);
    console.log('🔄 请刷新页面查看最新数据');
    alert(`成功导入 ${newTrades.length} 条测试数据！请刷新页面。`);
}

// 执行导入
importRealData();
