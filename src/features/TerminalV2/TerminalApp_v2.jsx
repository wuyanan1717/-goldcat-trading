/**
 * 实验性布局 V2 - 固定顶栏 + 折叠式日志
 * 
 * 改进：
 * 1. 搜索栏 + 启动按钮固定在顶部 (sticky)
 * 2. 系统日志改为右侧可折叠面板
 * 3. 观测结果始终在主视野中心
 * 
 * 用法：在 GoldCatApp.jsx 中切换 import 来测试
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Coins, Search, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Header } from './components/Header';
import { StatusPanel } from './components/StatusPanel';
import { TacticalPanel } from './components/TacticalPanel';
import { ResonanceChart } from './components/ResonanceChart';
import { BacktestModal } from './components/BacktestModal';
import { GuideModal } from './components/GuideModal';
import { DailyBriefModalBilingual } from './components/DailyBriefModalBilingual';
import { fetchBinanceKlines, fetchBacktestData } from './utils/market';
import { consultObserver } from './utils/observer';
import { runBacktestSimulation } from './utils/backtest';
import { detectFlatBottomGreen, detectBeheadingRed } from './utils/indicators';

const INITIAL_LOGS = [
    { id: 1, timestamp: new Date(), message: '量子观察者终端已就绪 (Quantum Observer Ready)', type: 'info' },
    { id: 2, timestamp: new Date(), message: '等待观测指令... (Awaiting Observation Command)', type: 'info' },
];

const INITIAL_PRESET_COINS = [
    { label: 'BTC', value: 'BTCUSDT', fixed: true },
    { label: 'ETH', value: 'ETHUSDT', fixed: true },
    { label: 'SOL', value: 'SOLUSDT', fixed: false },
    { label: 'DOGE', value: 'DOGEUSDT', fixed: false },
    { label: 'PEPE', value: 'PEPEUSDT', fixed: false },
    { label: 'SUI', value: 'SUIUSDT', fixed: false },
];

export default function TerminalAppV2({ lang, user, membership, onRequireLogin, onUpgrade }) {
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [score, setScore] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [showHit, setShowHit] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    // Symbol State
    const [activeSymbol, setActiveSymbol] = useState('BTCUSDT');
    const [customSymbol, setCustomSymbol] = useState(' ');
    const [presetCoins, setPresetCoins] = useState(INITIAL_PRESET_COINS);
    const [showSearchHint, setShowSearchHint] = useState(false);

    // Feature Toggles & State
    const [isTacticalEnabled, setIsTacticalEnabled] = useState(false);

    // 【新增】日志面板折叠状态
    const [isLogExpanded, setIsLogExpanded] = useState(false);

    // Data State
    const [data1m, setData1m] = useState([]);
    const [data5m, setData5m] = useState([]);
    const [data1h, setData1h] = useState([]);
    const [tacticalSignals, setTacticalSignals] = useState([]);
    const [lastTacticalScanTime, setLastTacticalScanTime] = useState(null);

    // Modals
    const [isBacktestOpen, setIsBacktestOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isBriefOpen, setIsBriefOpen] = useState(false);
    const [isBacktesting, setIsBacktesting] = useState(false);
    const [backtestResult, setBacktestResult] = useState(null);

    // Background Monitoring Data (Strategic)
    const [data15m, setData15m] = useState([]);
    const [data4h, setData4h] = useState([]);

    const logsEndRef = useRef(null);

    const addLog = useCallback((message, type = 'info') => {
        setLogs(prev => {
            const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);
            const newLogs = [...prev, { id: uniqueId, timestamp: new Date(), message, type }];
            return newLogs.slice(-100);
        });
    }, []);

    const initCharts = useCallback(async () => {
        addLog(lang === 'en' ? `Calibrating Time-Space Vector for ${activeSymbol}...` : `正在校准 ${activeSymbol} 时空向量...`, 'info');
        try {
            const [d1m, d5m, d1h] = await Promise.all([
                fetchBinanceKlines(activeSymbol, '1m', 60),
                fetchBinanceKlines(activeSymbol, '5m', 60),
                fetchBinanceKlines(activeSymbol, '1h', 60)
            ]);

            setData1m(d1m);
            setData5m(d5m);
            setData1h(d1h);

            if (d1m.length > 0) {
                const currentPrice = d1m[d1m.length - 1].v;
                const formattedPrice = currentPrice < 1
                    ? currentPrice.toPrecision(8)
                    : currentPrice.toLocaleString();

                const priceLog = lang === 'en'
                    ? `>>> Link Stable [${activeSymbol}]. Price: $${formattedPrice}`
                    : `>>> 链路稳定 [${activeSymbol}]。价格: $${formattedPrice}`;
                addLog(priceLog, 'alert');
                addLog(lang === 'en' ? 'Awaiting Observation Command...' : '等待观测指令 (Awaiting Observation)...', 'info');
            }

            setScore(0);
            setShowHit(false);
            setAiResult(null);
            setTacticalSignals([]);
        } catch (e) {
            console.error(e);
            addLog(lang === 'en' ? `Error: Connection Failed for ${activeSymbol}` : `错误：无法连接到 ${activeSymbol} 数据源。`, 'alert');
        }
    }, [addLog, activeSymbol, lang]);

    const runSilentTacticalScan = useCallback(async () => {
        try {
            const [d15m, d1h, d4h] = await Promise.all([
                fetchBinanceKlines(activeSymbol, '15m', 50),
                fetchBinanceKlines(activeSymbol, '1h', 50),
                fetchBinanceKlines(activeSymbol, '4h', 50)
            ]);

            setData15m(d15m);
            setData4h(d4h);

            const newSignals = [];

            const checkAndRecord = (data, timeframe) => {
                const fbgIndices = detectFlatBottomGreen(data);
                const recentFbg = fbgIndices.reverse().find(i => i >= data.length - 3);

                if (recentFbg !== undefined) {
                    const candle = data[recentFbg];
                    newSignals.push({
                        id: `FBG-${timeframe}-${candle.time}`,
                        timeframe: timeframe,
                        type: 'FLAT_BOTTOM_GREEN',
                        price: candle.l,
                        timestamp: candle.time || Date.now(),
                        strength: 'HIGH'
                    });
                }

                const brIndices = detectBeheadingRed(data);
                const recentBr = brIndices.reverse().find(i => i >= data.length - 3);

                if (recentBr !== undefined) {
                    const candle = data[recentBr];
                    newSignals.push({
                        id: `BR-${timeframe}-${candle.time}`,
                        timeframe: timeframe,
                        type: 'BEHEADING_RED',
                        price: candle.v,
                        timestamp: candle.time || Date.now(),
                        strength: 'HIGH'
                    });
                }
            };

            checkAndRecord(d15m, '15M');
            checkAndRecord(d1h, '1H');
            checkAndRecord(d4h, '4H');

            setTacticalSignals(newSignals);
            setLastTacticalScanTime(new Date());

        } catch (e) {
            console.error("Background scan failed", e);
        }
    }, [activeSymbol]);

    useEffect(() => {
        const handleOpenGuide = () => setIsGuideOpen(true);
        document.addEventListener('OPEN_GUIDE', handleOpenGuide);
        return () => document.removeEventListener('OPEN_GUIDE', handleOpenGuide);
    }, []);

    useEffect(() => {
        let intervalId;

        if (isTacticalEnabled) {
            addLog(`>>> 战术监控 [${activeSymbol}] 已激活...`, 'info');
            runSilentTacticalScan();
            intervalId = setInterval(() => {
                runSilentTacticalScan();
            }, 60000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isTacticalEnabled, runSilentTacticalScan, addLog, activeSymbol]);

    useEffect(() => {
        addLog(lang === 'en' ? 'Quantum Observer Terminal Ready' : '量子观察者终端已就绪 (Quantum Observer Ready)', 'info');
        addLog(lang === 'en' ? 'Awaiting Observation Command...' : '等待观测指令... (Awaiting Observation Command)', 'info');
        initCharts();
    }, [addLog, initCharts, lang, activeSymbol]);

    // 【修改】移除自动滚动，避免视线跳动
    // useEffect(() => {
    //     if (logsEndRef.current && isScanning) {
    //         logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    //     }
    // }, [logs, isScanning]);

    const runResonanceScan = async () => {
        if (isScanning) return;

        if (!user) {
            onRequireLogin();
            return;
        }

        if (data1m.length === 0) {
            addLog('错误：无数据流...', 'alert');
            await initCharts();
            return;
        }

        setIsScanning(true);
        setShowHit(false);
        setScore(0);
        setAiResult(null);
        setShowSearchHint(false);

        addLog(lang === 'en' ? 'Measuring Market Entanglement...' : '测量市场纠缠态 (Entanglement Check)...', 'info');
        await new Promise(r => setTimeout(r, 600));

        if (isTacticalEnabled) {
            await runSilentTacticalScan();
        }

        addLog(lang === 'en' ? 'Calculating Wave Function Collapse...' : '计算波函数坍缩概率...', 'info');
        await new Promise(r => setTimeout(r, 800));
        addLog(lang === 'en' ? `Observing Schrödinger's Cat [${activeSymbol}]...` : `正在观测薛定谔的猫 [${activeSymbol}]...`, 'info');

        try {
            const analysis = await consultObserver(
                activeSymbol,
                data1m,
                data5m,
                data1h,
                { tacticalSignals: tacticalSignals },
                lang
            );

            if (analysis.quantum_phrase === 'LIMIT_EXCEEDED' || analysis.quantum_phrase === 'DAILY_LIMIT_REACHED') {
                const isPremium = membership?.isPremium;
                const message = isPremium
                    ? (lang === 'en' ? "Daily Limit Reached (30/30).\nPlease come back tomorrow." : "今日观测次数已达上限 (30/30)。\n请明日再来。")
                    : (lang === 'en' ? "Free Limit Reached (2/2).\nUpgrade to PRO for 30 daily scans + more features!" : "免费观测次数已耗尽 (2/2)。\n升级 PRO 会员解锁每日 30 次观测 + 更多特权！");

                if (!isPremium) {
                    if (window.confirm(message)) {
                        onUpgrade();
                    }
                } else {
                    alert(message);
                }

                addLog(analysis.conclusion, 'alert');
                return;
            }

            setAiResult(analysis);

            addLog(analysis.quantum_phrase, 'info');
            await new Promise(r => setTimeout(r, 600));

            const completionLog = lang === 'en'
                ? `Observation Complete. AI Confidence: ${100 - analysis.uncertainty}%`
                : `观测完成。AI确信度: ${100 - analysis.uncertainty}%`;
            addLog(completionLog, 'alert');

            const conclusionLog = lang === 'en'
                ? `Conclusion: "${analysis.conclusion}"`
                : `结论："${analysis.conclusion}"`;
            addLog(conclusionLog, 'alert');

            const strength = Math.abs(analysis.probability_up - 50) * 2;
            setScore(strength);
            setShowHit(true);

        } catch (error) {
            console.error(error);
            addLog(lang === 'en' ? 'Observation Failed. Wave Function Decoherence...' : '观测失败，波函数退相干...', 'alert');
        } finally {
            setIsScanning(false);
        }
    };

    const handleBacktest = async () => {
        setIsBacktestOpen(true);
        setIsBacktesting(true);
        setBacktestResult(null);

        try {
            const { d1m, d5m, d1h } = await fetchBacktestData(activeSymbol);
            await new Promise(r => setTimeout(r, 1500));
            const result = runBacktestSimulation(d1m, d5m, d1h);
            setBacktestResult(result);
            addLog(`[${activeSymbol}] 历史时间线回溯完成。`, 'info');
        } catch (e) {
            console.error(e);
            addLog('无法获取历史数据。', 'alert');
        } finally {
            setIsBacktesting(false);
        }
    };

    const handleCustomSymbolSubmit = (e) => {
        e.preventDefault();
        if (customSymbol.trim()) {
            let sym = customSymbol.toUpperCase().trim();
            const commonQuotes = ['USDT', 'BUSD', 'USDC', 'BTC', 'ETH', 'DAI'];
            const hasQuote = commonQuotes.some(q => sym.endsWith(q));

            if (!hasQuote && sym.length <= 12) {
                sym += 'USDT';
            }

            // Check if this coin is already in the preset list
            const existingIndex = presetCoins.findIndex(c => c.value === sym);

            if (existingIndex === -1) {
                // New coin - replace the last replaceable coin (not BTC/ETH)
                const newPresetCoins = [...presetCoins];

                // Find the last replaceable coin (from the end, excluding fixed ones)
                for (let i = newPresetCoins.length - 1; i >= 0; i--) {
                    if (!newPresetCoins[i].fixed) {
                        // Extract label from symbol (remove USDT suffix)
                        const label = sym.replace(/USDT$|BUSD$|USDC$|BTC$|ETH$|DAI$/, '');
                        newPresetCoins[i] = { label, value: sym, fixed: false };
                        break;
                    }
                }

                setPresetCoins(newPresetCoins);
            }

            setActiveSymbol(sym);
            setCustomSymbol('');
            setShowSearchHint(true);
        }
    };

    return (
        <>
            <div className="min-h-screen flex flex-col relative z-10 w-full text-slate-300">
                {/* 【改进1】固定顶部区域 - Sticky Header */}
                <div className="sticky top-0 z-50 bg-[#0a0a0c]/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
                    <div className="max-w-7xl mx-auto px-2 md:px-8 py-1 md:py-2">
                        <Header
                            lang={lang}
                            onReset={initCharts}
                            onScan={runResonanceScan}
                            onBacktest={handleBacktest}
                            onOpenGuide={() => setIsGuideOpen(true)}
                            onOpenBrief={() => setIsBriefOpen(true)}
                            isScanning={isScanning}
                            isTacticalEnabled={isTacticalEnabled}
                            onToggleTactical={() => setIsTacticalEnabled(!isTacticalEnabled)}
                        />

                        {/* 【改进2】资产选择器集成到顶部 - 单行布局 */}
                        <div className="flex flex-row gap-2 justify-between items-center mt-1 pb-1">
                            <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide mask-linear-fade">
                                <span className="text-[10px] font-bold text-slate-500 uppercase px-1 whitespace-nowrap flex items-center gap-1 shrink-0">
                                    <Coins className="w-3 h-3" />
                                    <span className="hidden sm:inline">{lang === 'en' ? 'Target:' : '资产:'}</span>
                                </span>
                                {presetCoins.map(coin => (
                                    <button
                                        key={coin.value}
                                        onClick={() => setActiveSymbol(coin.value)}
                                        className={`text-[10px] font-mono px-2 py-0.5 md:px-3 md:py-1 rounded-sm border transition-all whitespace-nowrap shrink-0 ${activeSymbol === coin.value
                                            ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400 font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                            : 'border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-200'
                                            }`}
                                    >
                                        {coin.label}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleCustomSymbolSubmit} className="flex items-center gap-1 shrink-0">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={customSymbol}
                                        onChange={(e) => setCustomSymbol(e.target.value)}
                                        placeholder={lang === 'en' ? "SYMBOL" : "代码"}
                                        className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] md:text-xs px-2 py-1 w-20 md:w-40 rounded-sm focus:outline-none focus:border-yellow-600 font-mono uppercase placeholder:text-slate-600 transition-all focus:w-28 md:focus:w-40"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-0.5 top-0.5 p-0.5 md:p-1 hover:bg-slate-800 rounded cursor-pointer group-focus-within:text-yellow-500 text-slate-600 transition-all"
                                        title="加载"
                                    >
                                        <Search className="w-3 h-3" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <BacktestModal
                    isOpen={isBacktestOpen}
                    onClose={() => setIsBacktestOpen(false)}
                    isRunning={isBacktesting}
                    result={backtestResult}
                />

                <GuideModal
                    isOpen={isGuideOpen}
                    onClose={() => setIsGuideOpen(false)}
                    lang={lang}
                />

                <DailyBriefModalBilingual
                    isOpen={isBriefOpen}
                    onClose={() => setIsBriefOpen(false)}
                    lang={lang}
                />

                {/* 主内容区 */}
                <div className="flex-grow max-w-7xl mx-auto px-4 md:px-8 py-4 w-full">
                    <div className="space-y-4">
                        {/* AI 状态面板 - 始终在顶部可见 */}
                        <StatusPanel score={score} result={aiResult} lang={lang} showSearchHint={showSearchHint} />

                        {/* 战术面板 - 可选显示 */}
                        {isTacticalEnabled && (
                            <TacticalPanel
                                isEnabled={isTacticalEnabled}
                                signals={tacticalSignals}
                                isScanning={isScanning}
                                lastUpdated={lastTacticalScanTime}
                                lang={lang}
                            />
                        )}

                        {/* 图表区域 */}
                        <ResonanceChart
                            title={lang === 'en' ? `1M: Micro Field (${activeSymbol})` : `1M: 微观场 (${activeSymbol})`}
                            meta="QUANTUM_NOISE"
                            data={data1m}
                            color="#22d3ee"
                            isScanning={isScanning}
                            showHit={showHit}
                            enableTactical={false}
                        />

                        <ResonanceChart
                            title={lang === 'en' ? `5M: Structure Field (${activeSymbol})` : `5M: 结构场 (${activeSymbol})`}
                            meta="WAVE_PATTERN"
                            data={data5m}
                            color="#a78bfa"
                            isScanning={isScanning}
                            showHit={showHit}
                            enableTactical={false}
                        />

                        <ResonanceChart
                            title={lang === 'en' ? `1H: Macro Field (${activeSymbol})` : `1H: 宏观场 (${activeSymbol})`}
                            meta="GRAVITY_WELL"
                            data={data1h}
                            color="#fbbf24"
                            isScanning={isScanning}
                            showHit={showHit}
                            enableTactical={isTacticalEnabled}
                        />
                    </div>
                </div>

                {/* 【改进3】右侧悬浮日志面板 - 可折叠 */}
                <div className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${isLogExpanded ? 'w-80' : 'w-10'}`}>
                    {/* 折叠/展开按钮 */}
                    <button
                        onClick={() => setIsLogExpanded(!isLogExpanded)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-slate-900/90 border border-slate-700 border-r-0 rounded-l-lg p-2 hover:bg-slate-800 transition-colors"
                        title={isLogExpanded ? "收起日志" : "展开日志"}
                    >
                        <Terminal className="w-4 h-4 text-yellow-600" />
                    </button>

                    {/* 日志面板内容 */}
                    <div className={`bg-[#0a0a0c]/95 border border-slate-800 border-r-0 rounded-l-lg backdrop-blur-md shadow-xl h-[60vh] flex flex-col transition-opacity duration-300 ${isLogExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="flex items-center justify-between p-3 border-b border-slate-800">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Terminal className="w-3 h-3 text-yellow-600" />
                                {lang === 'en' ? 'SYSTEM LOG' : '系统日志'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setLogs([])}
                                    className="hover:text-red-500 transition-colors p-1"
                                    title="清空日志"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => setIsLogExpanded(false)}
                                    className="hover:text-slate-300 transition-colors p-1"
                                    title="关闭"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-[10px] font-mono scrollbar-hide">
                            {logs.map((log) => (
                                <div key={log.id} className={`${log.type === 'alert' ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}>
                                    <span className="opacity-30">[{log.timestamp.toLocaleTimeString('zh-CN', { hour12: false })}]</span> {log.message}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
