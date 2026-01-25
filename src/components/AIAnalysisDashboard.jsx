import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Bot, TrendingUp, TrendingDown,
    ShieldAlert, Sparkles, Activity, Clock, Target,
    ArrowUpRight, ArrowDownRight, Zap, Skull, Fingerprint,
    LayoutGrid, Shield, Rocket, Biohazard, User
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- Branding & Theme Constants ---
const THEME = {
    bg: '#09090b',
    card: '#18181b',
    border: '#27272a',
    primary: '#f59e0b', // Amber/Gold
    success: '#10b981', // Emerald
    danger: '#ef4444', // Red
    text: '#e4e4e7', // Zinc-200
    textDim: '#71717a' // Zinc-500
};


// --- Risk Mode Configuration ---
const RISK_PROFILES = {
    defensive: {
        label: { zh: '防御', en: 'Defensive' },
        minRisk: 0.5,
        maxRisk: 1.0,
        color: '#3b82f6',
        icon: '/defense_mode.png',
        progress: 20,
        emoji: '🛡️'
    },
    balanced: {
        label: { zh: '稳健', en: 'Balanced' },
        minRisk: 1.0,
        maxRisk: 2.0,
        color: '#10b981',
        icon: '/steady_mode.png',
        progress: 40,
        emoji: '👤'
    },
    aggressive: {
        label: { zh: '激进', en: 'Aggressive' },
        minRisk: 2.0,
        maxRisk: 3.0,
        color: '#f59e0b',
        icon: '/aggressive_mode.png',
        progress: 70,
        emoji: '🚀'
    },
    degen: {
        label: { zh: '狂暴', en: 'Degen' },
        minRisk: 3.0,
        maxRisk: 10.0,
        color: '#ef4444',
        icon: '/berserk_mode.png',
        progress: 100,
        emoji: '☣️'
    }
};

// --- Localization Dictionary ---
const TRANSLATIONS = {
    en: {
        title: "Goldcat Terminal",
        agentActive: "AI Agent Active",
        tacComAnalysis: "Tac-Com Analysis",
        newInsight: "NEW INSIGHT",
        tokensUsed: "TOKENS: 450/500 Used",
        generateReport: "Generate Deep Report",
        netProfit: "Net Profit",
        winRate: "Win Rate",
        profitFactor: "Profit Factor",
        avgRR: "Avg R:R",
        equityCurve: "Equity Curve & Drawdown",
        traderDNA: "Trader DNA",
        directionalBias: "Directional Bias",
        performanceLeaders: "Performance Leaders",
        timeEdgeHeatmap: "Pattern Performance",
        riskAppetite: "Risk Appetite",
        growth: "Growth",
        drawdown: "Drawdown",
        long: "Long",
        short: "Short",
        trades: "Trades",
        printer: "The Printer (Top Gainers)",
        shredder: "The Shredder (Top Losers)",
        avgPnL: "Avg R",
        lossZone: "Loss Zone",
        profitZone: "Profit Zone",
        currentMode: "Current Mode",
        aggressive: "Aggressive",
        riskPerTrade: "Risk per trade: 2-3%",
        // aiMessage removed here as it will be generated dynamically
        dna: {
            discipline: "Discipline",
            winRate: "Win Rate",
            riskMgmt: "Risk Mgmt",
            frequency: "Frequency",
            patience: "Patience"
        },
        heatmap: {
            trend: "Trend Follow",
            breakout: "Breakout",
            reversal: "Reversal"
        }
    },
    zh: {
        title: "金猫终端",
        agentActive: "AI 代理已激活",
        tacComAnalysis: "战术指挥官分析",
        newInsight: "新洞察",
        tokensUsed: "Token: 450/500 已用",
        generateReport: "生成深度报告",
        netProfit: "净利润",
        winRate: "胜率",
        profitFactor: "盈亏比",
        avgRR: "平均盈亏比",
        equityCurve: "资金曲线 & 回撤",
        traderDNA: "交易员基因",
        directionalBias: "多空偏好",
        performanceLeaders: "表现榜单",
        timeEdgeHeatmap: "形态战绩表现",
        riskAppetite: "风险偏好",
        growth: "增长",
        drawdown: "回撤",
        long: "做多",
        short: "做空",
        trades: "交易",
        printer: "印钞机 (盈利榜)",
        shredder: "碎钞机 (亏损榜)",
        avgPnL: "平均 R",
        lossZone: "亏损区",
        profitZone: "盈利区",
        currentMode: "当前模式",
        aggressive: "激进",
        riskPerTrade: "单笔风险: 2-3%",
        // aiMessage removed here
        dna: {
            discipline: "纪律性",
            winRate: "胜率",
            riskMgmt: "风控",
            frequency: "频率",
            patience: "耐心"
        },
        heatmap: {
            trend: "趋势跟踪",
            breakout: "突破",
            reversal: "反转"
        }
    }
};

const COLORS = [THEME.success, THEME.danger];

// --- Components ---

const MetricCard = ({ title, value, change, isGood, icon: Icon, language }) => (
    <div
        className="bg-[#18181b] border border-[#27272a] p-4 rounded-xl flex flex-col justify-between h-32 hover:border-[#3f3f46] transition-colors group relative"
    >
        <div className="flex justify-between items-start">
            <span className="text-zinc-500 text-sm font-medium">{title}</span>
            {Icon && <Icon size={16} className="text-zinc-500" />}
        </div>
        <div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            {change && (
                <div className={`flex items-center text-xs font-mono font-bold ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isGood ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                    {change}
                </div>
            )}
        </div>

        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {language === 'zh' ? '对比最近30日' : 'Comparing last 30 days'}
        </div>
    </div>
);

const BentoCard = ({ title, children, className = "", icon: Icon, action }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden flex flex-col ${className}`}
    >
        <div className="p-4 border-b border-[#27272a] flex justify-between items-center bg-[#18181b]/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                {Icon && <Icon size={16} className="text-[#f59e0b]" />}
                <h3 className="text-zinc-200 font-semibold text-sm tracking-wide uppercase">{title}</h3>
            </div>
            {action}
        </div>
        <div className="p-4 flex-1 relative">
            {children}
        </div>
    </motion.div>
);

const AIAnalysisDashboard = ({ trades = [], language = 'en', riskMode = 'balanced', onRiskModeChange, totalCapital = 0 }) => {
    const t = TRANSLATIONS[language] || TRANSLATIONS.en;

    // --- Data Processing (Memoized) ---
    const stats = useMemo(() => {
        if (!trades || trades.length === 0) {
            return {
                netProfit: 0,
                winRate: 0,
                profitFactor: 0,
                avgRR: 0,
                equityCurve: [],
                traderDNA: [
                    { subject: t.dna.discipline, A: 0, fullMark: 100 },
                    { subject: t.dna.winRate, A: 0, fullMark: 100 },
                    { subject: t.dna.riskMgmt, A: 0, fullMark: 100 },
                    { subject: t.dna.frequency, A: 0, fullMark: 100 },
                    { subject: t.dna.patience, A: 0, fullMark: 100 },
                ],
                directionData: [
                    { name: t.long, value: 0 },
                    { name: t.short, value: 0 }
                ],
                printers: [],
                shredders: [],
                heatmap: { '4h': [], '1h': [], '15m': [] },
                riskAppetite: 'Neutral',
                winRateChange: 0,
                netProfitChange: 0,
                actualRiskMin: 0,
                actualRiskMax: 0,
                aiInsight: language === 'zh'
                    ? "还没有足够的交易数据来生成分析。请先记录一些交易。"
                    : "Master, not enough trade data to generate analysis. Please log some trades first."
            };
        }

        // 1. Core Metrics & Heatmap Classification
        let totalWins = 0;
        let totalLosses = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        let totalRR = 0;
        let rrCount = 0;
        let equity = 0;

        // Pattern Stats Accus
        const patternPerformance = {}; // { 'Trend-4h': { pnl: 0, wins: 0, total: 0 } }

        const getPatternType = (p) => {
            if (!p) return 'unknown';
            const str = p.toLowerCase();
            if (str.includes('trend') || str.includes('跟随') || str.includes('趋势')) return 'trend';
            if (str.includes('break') || str.includes('突破')) return 'breakout';
            if (str.includes('revers') || str.includes('反转')) return 'reversal';
            return 'other';
        };

        // Sort trades by date
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp));

        const equityCurve = sortedTrades.map((trade, index) => {
            const pnl = parseFloat(trade.profitLoss || 0);
            equity += pnl;

            if (pnl > 0) {
                totalWins++;
                grossProfit += pnl;
            } else if (pnl < 0) {
                totalLosses++;
                grossLoss += Math.abs(pnl);
            }

            if (trade.rrRatio) {
                totalRR += parseFloat(trade.rrRatio);
                rrCount++;
            }

            // Collect Pattern Stats for AI
            const pt = getPatternType(trade.pattern);
            const tf = trade.timeframe || '1h';
            const key = `${pt}|${tf}`;
            if (!patternPerformance[key]) {
                patternPerformance[key] = { pnl: 0, wins: 0, total: 0, rr: 0, name: trade.pattern || pt, tf: tf, type: pt };
            }
            patternPerformance[key].pnl += pnl;

            // PRIORITY 1: Use realizedRR if available (new field, always correct)
            // PRIORITY 2: Calculate from rrRatio + profitLoss (legacy fix)
            let actualRR = 0;
            if (trade.realizedRR !== null && trade.realizedRR !== undefined) {
                // New data with realizedRR field
                actualRR = parseFloat(trade.realizedRR);
            } else {
                // Legacy data: ensure rrRatio has correct sign based on profitLoss
                actualRR = parseFloat(trade.rrRatio || 0);
                if (pnl < 0 && actualRR > 0) {
                    // Loss trade but RR is positive (legacy bug) - flip it
                    actualRR = -actualRR;
                }
            }

            patternPerformance[key].rr += actualRR;
            patternPerformance[key].total++;
            if (pnl > 0) patternPerformance[key].wins++;

            return {
                date: index + 1,
                equity: equity,
                drawdown: pnl < 0 ? t.drawdown : t.growth,
                tooltipDate: new Date(trade.timestamp || trade.date).toLocaleDateString()
            };
        });

        const totalTrades = trades.length;
        const netProfit = grossProfit - grossLoss;
        const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
        const avgRR = rrCount > 0 ? totalRR / rrCount : 0;

        // 2. Dynamic AI Insight Generation
        // Find Best and Worst strategies
        const strategies = Object.values(patternPerformance);
        const bestStrat = strategies.sort((a, b) => b.pnl - a.pnl)[0];
        const worstStrat = strategies.sort((a, b) => a.pnl - b.pnl)[0]; // Sort ascending pnl, take first (lowest/most negative)

        let aiInsight;
        if (totalTrades < 5) {
            aiInsight = language === 'zh'
                ? <span>数据量不足（{totalTrades}/5），我无法进行深度战术分析。建议多记录几笔交易，我会为您寻找圣杯。</span>
                : <span>Master, distinct lack of data ({totalTrades}/5). I cannot perform Deep Tactical Analysis yet. Log more trades and I will find your edge.</span>;
        } else if (bestStrat && worstStrat) {
            // Formatting placeholders
            const bestName = bestStrat.name; // Use raw name or mapped type? Raw name is more user friendly if consistent.
            const bestTF = bestStrat.tf;
            const worstName = worstStrat.name;
            const worstTF = worstStrat.tf;
            const bestWR = (bestStrat.wins / bestStrat.total * 100).toFixed(0);

            if (language === 'zh') {
                aiInsight = (
                    <span>
                        "我分析了您最近 <span className="font-bold text-white">{totalTrades}</span> 笔交易。
                        您的 <span className="text-emerald-400 font-bold">{bestName}</span> 策略在 {bestTF} 级别表现优异（胜率 {bestWR}%）。
                        {worstStrat.pnl < 0 && (
                            <>
                                但请注意，您的 <span className="text-red-400 font-bold">{worstName} ({worstTF})</span> 正在造成亏损。
                            </>
                        )}
                        <br /><br />
                        <span className="text-amber-500 font-bold">建议：</span>
                        {worstStrat.pnl < 0 ? ` 暂停 ${worstName}，` : ''} 增加 {bestName} ({bestTF}) 的仓位权重。"
                    </span>
                );
            } else {
                aiInsight = (
                    <span>
                        "Master, I've analyzed your last <span className="font-bold text-white">{totalTrades}</span> trades.
                        Your <span className="text-emerald-400 font-bold">{bestName}</span> strategy on the {bestTF} timeframe is your distinct edge ({bestWR}% WR).
                        {worstStrat.pnl < 0 && (
                            <>
                                However, your <span className="text-red-400 font-bold">{worstName} ({worstTF})</span> setups are bleeding capital.
                            </>
                        )}
                        <br /><br />
                        <span className="text-amber-500 font-bold">Recommendation:</span>
                        {worstStrat.pnl < 0 ? ` Stop forcing ${worstName}.` : ''} Scale up on {bestName} ({bestTF})."
                    </span>
                );
            }
        } else {
            // Fallback
            aiInsight = language === 'zh'
                ? "您的交易表现非常平稳，我暂时没有发现显著的强项或漏洞。继续保持一致性。"
                : "Master, your trading is statistically flat. No significant edge or leak detected yet. Maintain consistency.";
        }


        // 3. Matrix Data Formatting
        console.log('📊 Pattern Performance Debug:', patternPerformance);

        const formatRow = (tf) => {
            return ['trend', 'breakout', 'reversal'].map(pt => {
                // Aggregate all sub-patterns that match this type
                const matchingStrats = strategies.filter(s => s.tf === tf && s.type === pt);
                const totalR = matchingStrats.reduce((sum, s) => sum + s.rr, 0);
                const totalCount = matchingStrats.reduce((sum, s) => sum + s.total, 0);
                const avgR = totalCount > 0 ? totalR / totalCount : 0;

                console.log(`📈 [${tf}][${pt}] Total R: ${totalR.toFixed(2)}, Count: ${totalCount}, Avg: ${avgR.toFixed(2)}`);

                return {
                    patternType: pt,
                    avg: avgR
                };
            });
        };

        const formattedHeatmap = {
            '4h': formatRow('4h'),
            '1h': formatRow('1h'),
            '15m': formatRow('15m'),
        };

        // 4. Other stats
        // 4. Calculate 30-Day Metric Changes (Last 30 days vs Previous 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        // Split trades into last 30 days and previous 30 days
        const last30DaysTrades = trades.filter(t => {
            const tradeDate = new Date(t.date || t.timestamp);
            return tradeDate >= thirtyDaysAgo && tradeDate <= now;
        });

        const prev30DaysTrades = trades.filter(t => {
            const tradeDate = new Date(t.date || t.timestamp);
            return tradeDate >= sixtyDaysAgo && tradeDate < thirtyDaysAgo;
        });

        // Calculate metrics for last 30 days
        const last30Profit = last30DaysTrades.reduce((sum, t) => sum + parseFloat(t.profitLoss || 0), 0);
        const last30Wins = last30DaysTrades.filter(t => parseFloat(t.profitLoss || 0) > 0).length;
        const last30WinRate = last30DaysTrades.length > 0 ? (last30Wins / last30DaysTrades.length) * 100 : 0;
        const last30GrossProfit = last30DaysTrades.filter(t => parseFloat(t.profitLoss || 0) > 0).reduce((sum, t) => sum + parseFloat(t.profitLoss), 0);
        const last30GrossLoss = Math.abs(last30DaysTrades.filter(t => parseFloat(t.profitLoss || 0) < 0).reduce((sum, t) => sum + parseFloat(t.profitLoss), 0));
        const last30ProfitFactor = last30GrossLoss > 0 ? last30GrossProfit / last30GrossLoss : (last30GrossProfit > 0 ? 999 : 0);
        const last30RR = last30DaysTrades.filter(t => t.rrRatio).reduce((sum, t) => sum + parseFloat(t.rrRatio), 0) / Math.max(1, last30DaysTrades.filter(t => t.rrRatio).length);

        // Calculate metrics for previous 30 days
        const prev30Profit = prev30DaysTrades.reduce((sum, t) => sum + parseFloat(t.profitLoss || 0), 0);
        const prev30Wins = prev30DaysTrades.filter(t => parseFloat(t.profitLoss || 0) > 0).length;
        const prev30WinRate = prev30DaysTrades.length > 0 ? (prev30Wins / prev30DaysTrades.length) * 100 : 0;
        const prev30GrossProfit = prev30DaysTrades.filter(t => parseFloat(t.profitLoss || 0) > 0).reduce((sum, t) => sum + parseFloat(t.profitLoss), 0);
        const prev30GrossLoss = Math.abs(prev30DaysTrades.filter(t => parseFloat(t.profitLoss || 0) < 0).reduce((sum, t) => sum + parseFloat(t.profitLoss), 0));
        const prev30ProfitFactor = prev30GrossLoss > 0 ? prev30GrossProfit / prev30GrossLoss : (prev30GrossProfit > 0 ? 999 : 0);
        const prev30RR = prev30DaysTrades.filter(t => t.rrRatio).reduce((sum, t) => sum + parseFloat(t.rrRatio), 0) / Math.max(1, prev30DaysTrades.filter(t => t.rrRatio).length);

        // Calculate percentage changes (show N/A if insufficient data)
        let netProfitChange = '-';
        let winRateChange = '-';
        let profitFactorChange = '-';
        let avgRRChange = '-';

        // Only calculate if we have trades in both periods
        if (prev30DaysTrades.length > 0) {
            // Win rate change (difference in percentage points)
            winRateChange = (last30WinRate - prev30WinRate).toFixed(1);

            // Profit factor change
            profitFactorChange = (last30ProfitFactor - prev30ProfitFactor).toFixed(2);

            // Avg RR change
            avgRRChange = (last30RR - prev30RR).toFixed(1);

            // Net profit change
            if (prev30Profit !== 0) {
                netProfitChange = ((last30Profit - prev30Profit) / Math.abs(prev30Profit) * 100).toFixed(1);
            } else if (last30Profit !== 0) {
                netProfitChange = last30Profit > 0 ? '+100.0' : '-100.0';
            } else {
                netProfitChange = '0.0';
            }
        }

        // Trader DNA
        const violatedCount = trades.filter(t => t.violatedDiscipline).length;
        const disciplineScore = Math.max(0, 100 - (violatedCount / totalTrades) * 500);
        const winRateScore = Math.min(100, winRate * 1.2);
        const riskMgmtScore = Math.min(100, avgRR * 30);
        const patienceScore = 75;
        const frequencyScore = Math.max(0, 100 - Math.abs(5 - (totalTrades / 30)) * 10);

        const traderDNA = [
            { subject: t.dna.discipline, A: Math.round(disciplineScore), fullMark: 100 },
            { subject: t.dna.winRate, A: Math.round(winRateScore), fullMark: 100 },
            { subject: t.dna.riskMgmt, A: Math.round(riskMgmtScore), fullMark: 100 },
            { subject: t.dna.frequency, A: Math.round(frequencyScore), fullMark: 100 },
            { subject: t.dna.patience, A: patienceScore, fullMark: 100 },
        ];

        // Direction
        const longTrades = trades.filter(t => t.direction === 'long' || t.tradeType === 'buy');
        const shortTrades = trades.filter(t => t.direction === 'short' || t.tradeType === 'sell');

        // Custom Win Rate Calculation: Wins / TOTAL Trades (Contribution Rate)
        const longWins = longTrades.filter(t => parseFloat(t.profitLoss || 0) > 0).length;
        const shortWins = shortTrades.filter(t => parseFloat(t.profitLoss || 0) > 0).length;

        // Denominator is direction specific trades (STANDARD Win Rate)
        const longWinRate = longTrades.length > 0 ? (longWins / longTrades.length * 100) : 0;
        const shortWinRate = shortTrades.length > 0 ? (shortWins / shortTrades.length * 100) : 0;

        console.log('📊 Long/Short Win Rates:', {
            totalTrades,
            longWins,
            shortWins,
            longWinRate: longWinRate.toFixed(1) + '%',
            shortWinRate: shortWinRate.toFixed(1) + '%'
        });

        const directionData = [
            { name: t.long, value: longTrades.length },
            { name: t.short, value: shortTrades.length }
        ];

        // Leaders
        const symbolStats = trades.reduce((acc, trade) => {
            if (!acc[trade.symbol]) acc[trade.symbol] = { profit: 0, count: 0, type: trade.pattern };
            acc[trade.symbol].profit += parseFloat(trade.profitLoss || 0);
            return acc;
        }, {});
        const sortedSymbols = Object.entries(symbolStats)
            .map(([symbol, data]) => ({ symbol, profit: data.profit, type: data.type }))
            .sort((a, b) => b.profit - a.profit);
        const printers = sortedSymbols.filter(s => s.profit > 0).slice(0, 3);
        const shredders = sortedSymbols.filter(s => s.profit < 0).sort((a, b) => a.profit - b.profit).slice(0, 3);

        // Calculate Average Risk and Determine Risk Mode
        const riskPercentages = trades
            .map(trade => parseFloat(trade.accountRiskPercent || 0))
            .filter(risk => risk > 0);

        let avgRisk = 0;
        let autoRiskMode = riskMode; // Default to current mode

        if (riskPercentages.length > 0) {
            // Calculate average
            avgRisk = riskPercentages.reduce((sum, r) => sum + r, 0) / riskPercentages.length;

            // Auto-determine mode based on average risk
            if (avgRisk < 5.0) {
                autoRiskMode = 'defensive';
            } else if (avgRisk < 10.0) {
                autoRiskMode = 'balanced';
            } else if (avgRisk < 20.0) {
                autoRiskMode = 'aggressive';
            } else {
                autoRiskMode = 'degen';
            }
        }

        // Extract Real Risk Percentages from stored values (min/max)
        let actualRiskMin = 0;
        let actualRiskMax = 0;
        if (riskPercentages.length > 0) {
            actualRiskMin = Math.min(...riskPercentages);
            actualRiskMax = Math.max(...riskPercentages);
        }

        return {
            netProfit,
            winRate,
            profitFactor,
            avgRR,
            equityCurve,
            traderDNA,
            directionData,
            printers,
            shredders,
            heatmap: formattedHeatmap,
            riskMode: autoRiskMode,
            riskProfile: RISK_PROFILES[autoRiskMode],
            winRateChange,
            netProfitChange,
            profitFactorChange,
            avgRRChange,
            longWinRate,
            shortWinRate,
            actualRiskMin,
            actualRiskMax,
            avgRisk,
            aiInsight
        };

    }, [trades, t, language, totalCapital]);
    // Added language to dependency to trigger re-translation of AI message

    // Format helpers
    const formatCurrency = (val) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-4 md:px-[10px] md:pt-0 md:pb-8 space-y-6">

            {/* 1. Header Removed as requested */}


            {/* 2. Hero: AI Tactical Commander */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-gradient-to-r from-[#18181b] to-[#121215] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="flex flex-col md:flex-row gap-6 items-start z-10 relative">
                    <div className="flex-shrink-0 relative">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center relative overflow-hidden">
                            <img src="/goldcat_ai_avatar.jpg" alt="AI Avatar" className="w-full h-full object-cover relative z-10" />
                            <div className="absolute inset-0 bg-amber-500/10 blur-xl" />
                        </div>

                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-lg font-bold text-white">{t.tacComAnalysis}</h2>
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-mono">{t.newInsight}</span>
                        </div>
                        <div className="bg-[#09090b]/50 border border-[#27272a]/50 p-4 rounded-xl relative">
                            <div className="absolute -left-2 top-4 w-2 h-2 bg-[#09090b] border-l border-t border-[#27272a]/50 rotate-45 transform"></div>
                            <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                                {stats.aiInsight}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button className="px-6 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 whitespace-nowrap">
                            {t.generateReport}
                        </button>
                        <div className="text-[10px] text-center text-zinc-600 font-mono">{t.tokensUsed}</div>
                    </div>
                </div>
            </motion.div>

            {/* 3. Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    title={t.netProfit}
                    value={formatCurrency(stats.netProfit)}
                    change={stats.netProfitChange === '-' ? null : `${parseFloat(stats.netProfitChange) >= 0 ? '+' : ''}${stats.netProfitChange}%`}
                    isGood={stats.netProfitChange === '-' ? true : parseFloat(stats.netProfitChange) >= 0}
                    icon={Target}
                    language={language}
                />
                <MetricCard
                    title={t.winRate}
                    value={`${stats.winRate.toFixed(1)}%`}
                    change={stats.winRateChange === '-' ? null : `${parseFloat(stats.winRateChange) >= 0 ? '+' : ''}${stats.winRateChange}%`}
                    isGood={stats.winRateChange === '-' ? true : parseFloat(stats.winRateChange) >= 0}
                    icon={Activity}
                    language={language}
                />
                <MetricCard
                    title={t.profitFactor}
                    value={stats.profitFactor.toFixed(2)}
                    change={stats.profitFactorChange === '-' ? null : `${parseFloat(stats.profitFactorChange) >= 0 ? '+' : ''}${stats.profitFactorChange}`}
                    isGood={stats.profitFactorChange === '-' ? true : parseFloat(stats.profitFactorChange) >= 0}
                    icon={TrendingUp}
                    language={language}
                />
                <MetricCard
                    title={t.avgRR}
                    value={`1:${stats.avgRR.toFixed(1)}`}
                    change={stats.avgRRChange === '-' ? null : `${parseFloat(stats.avgRRChange) >= 0 ? '+' : ''}${stats.avgRRChange}`}
                    isGood={stats.avgRRChange === '-' ? true : parseFloat(stats.avgRRChange) >= 0}
                    icon={TrendingDown}
                    language={language}
                />
            </div>

            {/* 4. The Analysis Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 grid-rows-[auto_auto]">

                {/* Card A: Equity Curve (Large - 2 cols) */}
                <BentoCard title={t.equityCurve} className="hidden md:block md:col-span-2 lg:col-span-2 min-h-[300px]" icon={TrendingUp}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.equityCurve}>
                            <defs>
                                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={THEME.success} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={THEME.success} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} hide />
                            <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                labelFormatter={(label, payload) => payload[0]?.payload.tooltipDate}
                            />
                            <Area type="monotone" dataKey="equity" stroke={THEME.success} strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </BentoCard>

                {/* Card B: Radar Chart (Medium) */}
                <BentoCard title={t.traderDNA} className="hidden md:block md:col-span-1 min-h-[300px]" icon={Fingerprint}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.traderDNA}>
                            <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="You"
                                dataKey="A"
                                stroke={THEME.primary}
                                strokeWidth={2}
                                fill={THEME.primary}
                                fillOpacity={0.4}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </BentoCard>

                {/* Card E: Directional Bias */}
                <BentoCard title={t.directionalBias} className="hidden md:block md:col-span-1 min-h-[420px]" icon={Zap}>
                    <div className="relative flex items-center justify-center mt-[-20px]">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={stats.directionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.directionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Stats */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-white">{trades.length}</span>
                            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">{t.trades}</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-[-8px]">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-1 rounded-full bg-emerald-500"></div>
                            <span className="text-xs text-zinc-400">{t.long} ({trades.length > 0 ? Math.round((stats.directionData[0].value / trades.length) * 100) : 0}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-1 rounded-full bg-red-500"></div>
                            <span className="text-xs text-zinc-400">{t.short} ({trades.length > 0 ? Math.round((stats.directionData[1].value / trades.length) * 100) : 0}%)</span>
                        </div>
                    </div>

                    {/* Win Rates Display */}
                    <div className="grid grid-cols-2 gap-4 mt-6 border-t border-zinc-800/50 pt-4 px-4 pb-2">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-medium">{language === 'zh' ? '做多胜率' : 'Long Win Rate'}</span>
                            <span className="text-lg font-bold text-emerald-500 font-mono">{stats.longWinRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-medium">{language === 'zh' ? '做空胜率' : 'Short Win Rate'}</span>
                            <span className="text-lg font-bold text-red-500 font-mono">{stats.shortWinRate.toFixed(1)}%</span>
                        </div>
                    </div>
                </BentoCard>

                {/* Card D: Printer vs Shredder */}
                <BentoCard title={t.performanceLeaders} className="md:col-span-1 lg:col-span-1 min-h-[300px]" icon={TrendingUp}>
                    <div className="h-full flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
                        {/* Printers */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">{t.printer}</h4>
                            {stats.printers.length === 0 ? (
                                <div className="text-xs text-zinc-600 italic p-2">No winning symbols yet</div>
                            ) : (
                                stats.printers.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-zinc-200">{item.symbol}</span>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-[#18181b] text-zinc-500 border border-[#27272a]">{item.type || 'N/A'}</span>
                                        </div>
                                        <span className="font-mono font-bold text-emerald-400 text-sm">+{formatCurrency(item.profit)}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="h-[1px] bg-[#27272a] w-full my-1"></div>

                        {/* Shredders */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">{t.shredder}</h4>
                            {stats.shredders.length === 0 ? (
                                <div className="text-xs text-zinc-600 italic p-2">No losing symbols yet</div>
                            ) : (
                                stats.shredders.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-zinc-200">{item.symbol}</span>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-[#18181b] text-zinc-500 border border-[#27272a]">{item.type || 'N/A'}</span>
                                        </div>
                                        <span className="font-mono font-bold text-red-400 text-sm">{formatCurrency(item.profit)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </BentoCard>

                {/* Card C: Pattern & Time Strategy Matrix (Refined) */}
                <BentoCard title={t.timeEdgeHeatmap} className="md:col-span-2 lg:col-span-2 min-h-[250px]" icon={LayoutGrid}>
                    <div className="h-full flex flex-col justify-center">
                        <div className="grid grid-cols-[auto_1fr] gap-4">
                            {/* Y-Axis Labels */}
                            <div className="flex flex-col justify-around text-xs font-mono text-zinc-500 py-4">
                                <div>4h</div>
                                <div>1h</div>
                                <div>15m</div>
                            </div>

                            {/* Matrix */}
                            <div className="grid grid-cols-3 gap-2">
                                {/* Headers (X-Axis) */}
                                <div className="text-[10px] text-center text-zinc-500 uppercase font-bold tracking-wider mb-1 col-span-1">{t.heatmap.trend}</div>
                                <div className="text-[10px] text-center text-zinc-500 uppercase font-bold tracking-wider mb-1 col-span-1">{t.heatmap.breakout}</div>
                                <div className="text-[10px] text-center text-zinc-500 uppercase font-bold tracking-wider mb-1 col-span-1">{t.heatmap.reversal}</div>

                                {/* Row 4h */}
                                {stats.heatmap['4h'] && stats.heatmap['4h'].map((d, i) => (
                                    <HeatmapCell key={i} value={d.avg.toFixed(1)} isHot={d.avg > 0.5} isCold={d.avg < -0.1} label={t.avgPnL} />
                                ))}

                                {/* Row 1h */}
                                {stats.heatmap['1h'] && stats.heatmap['1h'].map((d, i) => (
                                    <HeatmapCell key={i} value={d.avg.toFixed(1)} isHot={d.avg > 0.5} isCold={d.avg < -0.1} label={t.avgPnL} />
                                ))}

                                {/* Row 15m */}
                                {stats.heatmap['15m'] && stats.heatmap['15m'].map((d, i) => (
                                    <HeatmapCell key={i} value={d.avg.toFixed(1)} isHot={d.avg > 0.5} isCold={d.avg < -0.1} label={t.avgPnL} />
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-4 px-8">
                            <div className="text-[10px] text-zinc-600 flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#ef4444] rounded sm"></div> {t.lossZone}
                            </div>
                            <div className="text-[10px] text-zinc-600 flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#10b981] rounded sm"></div> {t.profitZone}
                            </div>
                        </div>
                    </div>
                </BentoCard>

                {/* Risk Mode Switcher - Fluid List Design */}
                <BentoCard title={t.riskAppetite} className="md:col-span-1 lg:col-span-1 min-h-[250px]" icon={ShieldAlert}>
                    <div className="relative overflow-hidden">

                        {/* Top Dashboard - Current Mode Display */}
                        <div className="relative z-10 mt-8 mb-10 flex flex-col items-center justify-center text-center">
                            {/* Icon - Enlarged and Moved Up */}
                            <img
                                src={stats.riskProfile.icon}
                                alt={stats.riskProfile.label[language]}
                                className="w-[150px] h-[150px] mb-6 opacity-80 transition-all duration-300"
                            />

                            <h2 className="text-white text-2xl font-bold tracking-wide mb-3">
                                {stats.riskProfile.label[language]}
                            </h2>
                            <p
                                className="font-mono text-sm font-medium tracking-wider text-zinc-400"
                            >
                                {language === 'zh' ? '单笔风险' : 'Risk'}
                            </p>
                            <p
                                className="font-mono text-3xl mt-2 font-bold tracking-tight"
                                style={{ color: stats.riskProfile.color }}
                            >
                                {stats.avgRisk > 0
                                    ? `${stats.avgRisk.toFixed(1)}%`
                                    : `${stats.riskProfile.minRisk}%-${stats.riskProfile.maxRisk}%${stats.riskProfile.maxRisk >= 10 ? '+' : ''}`
                                }
                            </p>
                        </div>

                        {/* Degen Mode Warning */}
                        {stats.riskMode === 'degen' && (
                            <motion.div
                                className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 flex items-center gap-2 backdrop-blur-sm relative z-10"
                                animate={{
                                    opacity: [0.6, 1, 0.6],
                                    scale: [0.98, 1.02, 0.98]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Biohazard size={18} className="text-red-400" />
                                <span className="text-xs text-red-400 font-bold">
                                    {language === 'zh' ? '⚠️ 极高风险模式' : '⚠️ EXTREME RISK MODE'}
                                </span>
                            </motion.div>
                        )}

                        {/* Bottom Decoration */}
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mt-6 relative z-10" />
                        <div className="text-center mt-3 text-[10px] text-zinc-600 uppercase tracking-[0.2em] relative z-10">
                            Goldcat AI Risk Engine
                        </div>
                    </div>
                </BentoCard>

            </div >
        </div >
    );
};

const HeatmapCell = ({ value, isHot, isCold, label }) => {
    let bg = "bg-[#27272a]";
    let rounded = "rounded-lg";

    // Adjusted thresholds
    if (isHot) bg = "bg-emerald-500/20 border border-emerald-500/30";
    if (isCold) bg = "bg-red-500/20 border border-red-500/30";

    return (
        <div className={`${bg} ${rounded} h-16 flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer group`}>
            <span className={`text-base font-bold ${isHot ? 'text-emerald-400' : isCold ? 'text-red-400' : 'text-zinc-400'}`}>
                {value > 0 ? '+' : ''}{value}R
            </span>
            <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400">{label}</span>
        </div>
    );
};

// Global CSS for Shimmer Animation
if (typeof document !== 'undefined') {
    const styleId = 'risk-mode-animations';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes shimmer {
                0% { transform: translateX(-100%) skewX(-12deg); }
                100% { transform: translateX(200%) skewX(-12deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

export default AIAnalysisDashboard;
