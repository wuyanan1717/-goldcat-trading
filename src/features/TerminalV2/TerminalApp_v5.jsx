/**
 * V5 - ISOLATED DEVELOPMENT VERSION
 * 
 * This is the isolated environment for V5 features.
 * All changes in V5 must be made here or in src/features/TerminalV2/components/v5/
 * 
 * Version: 5.0 (Alpha)
 * Baseline: Cloned from V4 Stable
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Coins, Search, Trash2 } from 'lucide-react';
import { Header } from './components/Header';
import { StatusPanel } from './components/v5/StatusPanel';
import { TacticalPanel } from './components/v4/TacticalPanel';
import { ResonanceChart } from './components/ResonanceChart';
import { BacktestModal } from './components/BacktestModal';
import { GuideModal } from './components/GuideModal';
import { DailyBriefModalBilingual } from './components/DailyBriefModalBilingual';
import { QuotaLimitModal } from './components/v4/QuotaLimitModal';
import { fetchBinanceKlines, fetchBacktestData } from './utils/market';
import { consultObserver } from './utils/v4/observer';
import { runBacktestSimulation } from './utils/backtest';
import { detectFlatBottomGreen, detectBeheadingRed } from './utils/indicators';

const INITIAL_LOGS = [
    { id: 1, timestamp: new Date(), message: 'AI 观察者终端已就绪 (AI Observer Ready)', type: 'info' },
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

export default function TerminalAppV5({ lang, user, membership, onRequireLogin, onUpgrade, onAutoFill }) {
    console.log('TerminalAppV5 Props:', { lang, user, hasOnAutoFill: !!onAutoFill });
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [score, setScore] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [showHit, setShowHit] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    // SAFE device detection: null initially, set via useEffect to avoid SSR/hydration mismatch
    const [isDesktop, setIsDesktop] = useState(null);

    // 从 localStorage 读取活跃币种和预设列表
    const [activeSymbol, setActiveSymbol] = useState(() => {
        const saved = localStorage.getItem('activeSymbol');
        return saved || 'BTCUSDT';
    });
    const [customSymbol, setCustomSymbol] = useState('');
    const [presetCoins, setPresetCoins] = useState(() => {
        const saved = localStorage.getItem('presetCoins');
        return saved ? JSON.parse(saved) : INITIAL_PRESET_COINS;
    });
    const [showSearchHint, setShowSearchHint] = useState(false);
    // 从 localStorage 读取战术雷达的状态，默认为 false
    const [isTacticalEnabled, setIsTacticalEnabled] = useState(() => {
        const saved = localStorage.getItem('tacticalRadarEnabled');
        return saved === 'true';
    });

    const [data1m, setData1m] = useState([]);
    const [data5m, setData5m] = useState([]);
    const [data1h, setData1h] = useState([]);
    const [tacticalSignals, setTacticalSignals] = useState([]);
    const [lastTacticalScanTime, setLastTacticalScanTime] = useState(null);

    const [isBacktestOpen, setIsBacktestOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isBriefOpen, setIsBriefOpen] = useState(false);
    const [isBacktesting, setIsBacktesting] = useState(false);
    const [backtestResult, setBacktestResult] = useState(null);

    const [data15m, setData15m] = useState([]);
    const [data4h, setData4h] = useState([]);
    const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

    const logsEndRef = useRef(null);

    const addLog = useCallback((message, type = 'info') => {
        setLogs(prev => {
            const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);
            const newLogs = [...prev, { id: uniqueId, timestamp: new Date(), message, type }];
            return newLogs.slice(-100);
        });
    }, []);

    const initCharts = useCallback(async () => {
        // OPTIMIZATION: Reset AI state IMMEDIATELY to prevent "ghost data" from previous coin persisting during fetch
        setScore(0);
        setShowHit(false);
        setAiResult(null);
        setTacticalSignals([]);
        // Clear charts immediately to prevent "ghost data" visual lag
        setData1m([]);
        setData5m([]);
        setData1h([]);

        addLog(lang === 'en' ? `Calibrating AI Vector for ${activeSymbol}...` : `正在校准 ${activeSymbol} AI 向量...`, 'info');
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
                const formattedPrice = currentPrice < 1 ? currentPrice.toPrecision(8) : currentPrice.toLocaleString();
                addLog(lang === 'en' ? `>>> Link Stable [${activeSymbol}]. Price: $${formattedPrice}` : `>>> 链路稳定 [${activeSymbol}]。价格: $${formattedPrice}`, 'alert');
                addLog(lang === 'en' ? 'Awaiting Observation Command...' : '等待观测指令 (Awaiting Observation)...', 'info');
            }
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
                // Fix: Only trigger on CONFIRMED (Closed) candles.
                // Exclude data.length - 1 (current open candle).
                // Check last 2 closed candles (length-2, length-3) for recent signals.
                const recentFbg = fbgIndices.reverse().find(i => i < data.length - 1 && i >= data.length - 3);

                if (recentFbg !== undefined) {
                    const candle = data[recentFbg];
                    newSignals.push({ id: `FBG-${timeframe}-${candle.time}`, timeframe, type: 'FLAT_BOTTOM_GREEN', price: candle.l, timestamp: candle.time || Date.now(), strength: 'HIGH' });
                }

                const brIndices = detectBeheadingRed(data);
                // Fix: Same for Beheading Red - Confirmed candles only.
                const recentBr = brIndices.reverse().find(i => i < data.length - 1 && i >= data.length - 3);

                if (recentBr !== undefined) {
                    const candle = data[recentBr];
                    newSignals.push({ id: `BR-${timeframe}-${candle.time}`, timeframe, type: 'BEHEADING_RED', price: candle.v, timestamp: candle.time || Date.now(), strength: 'HIGH' });
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

    const runResonanceScan = async () => {
        if (isScanning) return;
        if (!user) { onRequireLogin(); return; }
        if (data1m.length === 0) { addLog('错误：无数据流...', 'alert'); await initCharts(); return; }

        setIsScanning(true);
        setShowHit(false);
        setScore(0);
        setAiResult(null);
        setShowSearchHint(false);

        addLog(lang === 'en' ? 'Measuring Market Correlation...' : '测量市场相关性 (Correlation Check)...', 'info');
        await new Promise(r => setTimeout(r, 600));

        // --- 1. FORCE DATA REFRESH (Fix for Latency) ---
        addLog(lang === 'en' ? 'Synchronizing Real-time AI State...' : '同步实时 AI 场态数据...', 'info');
        let freshData1m = data1m;
        let freshData5m = data5m;
        let freshData1h = data1h;

        try {
            const [d1m, d5m, d1h] = await Promise.all([
                fetchBinanceKlines(activeSymbol, '1m', 60),
                fetchBinanceKlines(activeSymbol, '5m', 60),
                fetchBinanceKlines(activeSymbol, '1h', 60)
            ]);
            freshData1m = d1m;
            freshData5m = d5m;
            freshData1h = d1h;

            // Update UI State as well so charts jump to latest
            setData1m(d1m);
            setData5m(d5m);
            setData1h(d1h);
        } catch (fetchErr) {
            console.error("Fresh data fetch failed, using cached state", fetchErr);
            addLog(lang === 'en' ? 'Warning: Using cached data (Network Lag)' : '警报：网络延迟，使用缓存数据', 'alert');
        }

        if (isTacticalEnabled) await runSilentTacticalScan();
        addLog(lang === 'en' ? 'Calculating Probability Distribution...' : '计算概率分布...', 'info');
        await new Promise(r => setTimeout(r, 800));
        addLog(lang === 'en' ? `Analyzing Neural Pattern [${activeSymbol}]...` : `正在分析神经网络模式 [${activeSymbol}]...`, 'info');

        try {
            // Use freshData variables instead of state
            const analysis = await consultObserver(activeSymbol, freshData1m, freshData5m, freshData1h, { tacticalSignals }, lang);

            if (analysis.quantum_phrase === 'LIMIT_EXCEEDED' || analysis.quantum_phrase === 'DAILY_LIMIT_REACHED') {
                setIsQuotaModalOpen(true);
                addLog(analysis.conclusion, 'alert');
                return;
            }
            setAiResult(analysis);
            addLog(analysis.quantum_phrase, 'info');
            await new Promise(r => setTimeout(r, 600));
            addLog(lang === 'en' ? `Observation Complete. AI Confidence: ${100 - analysis.uncertainty}%` : `观测完成。AI确信度: ${100 - analysis.uncertainty}%`, 'alert');
            addLog(lang === 'en' ? `Conclusion: "${analysis.conclusion}"` : `结论："${analysis.conclusion}"`, 'alert');
            setScore(Math.abs(analysis.probability_up - 50) * 2);

            // Log Support/Resistance - EVEN IF 0 (For debugging)
            if (analysis.support_price !== undefined || analysis.resistance_price !== undefined) {
                addLog(lang === 'en'
                    ? `KEY LEVELS (Intraday 1-4h): Support $${analysis.support_price} / Resistance $${analysis.resistance_price}`
                    : `关键点位 (日内1-4h): 支撑 $${analysis.support_price} / 阻力 $${analysis.resistance_price}`,
                    'alert');
            }

            setShowHit(true);
        } catch (error) {
            console.error(error);
            addLog(lang === 'en' ? 'Observation Failed.' : '观测失败，波函数退相干...', 'alert');
        } finally {
            setIsScanning(false);
        }
    };

    const handleBacktest = () => {
        if (!activeSymbol) return;
        setIsBacktestOpen(true);
        setBacktestResult(null);
        setIsBacktesting(true);

        // Simulate async backtest
        // In real app, this would process historical data
        setTimeout(async () => {
            try {
                // Fetch more history for backtest? Or use existing?
                // For V5 demo, we generate a "scenario" based on current data
                const result = await runBacktestSimulation(activeSymbol, data5m); // Mock function
                setBacktestResult(result);
            } catch (e) {
                console.error(e);
            } finally {
                setIsBacktesting(false);
            }
        }, 3000);
    };

    // Tactical Radar Scanner (Runs on isTacticalEnabled toggle or manual trigger)
    useEffect(() => {
        if (!isTacticalEnabled) return;

        let intervalId;
        if (isTacticalEnabled) {
            addLog(`>>> 战术监控 [${activeSymbol}] 已激活...`, 'info');
            runSilentTacticalScan();
            intervalId = setInterval(() => runSilentTacticalScan(), 60000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [isTacticalEnabled, runSilentTacticalScan, addLog, activeSymbol]);

    // Handle Custom Symbol Search
    const handleCustomSymbolSubmit = async (e) => {
        e.preventDefault();
        if (!customSymbol) return;
        const formatted = customSymbol.toUpperCase().trim();
        // Basic validation
        if (!formatted.endsWith('USDT') && !formatted.endsWith('USD')) {
            // suggest appending USDT?
            // For now just assume user knows what they are doing or auto-append
        }
        setActiveSymbol(formatted);
        localStorage.setItem('activeSymbol', formatted);
        setCustomSymbol('');
        setShowSearchHint(true);
        // initCharts will trigger automatically due to activeSymbol dependency
    };

    // Device detection
    useEffect(() => {
        setIsDesktop(window.innerWidth >= 768);
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleCreateOrder = (orderParams) => {
        if (onAutoFill) {
            onAutoFill(orderParams);
        } else {
            console.error('Create Order failed: onAutoFill is missing');
            addLog(lang === 'en' ? 'Trading module not connected.' : '交易模块未连接。', 'alert');
        }
    };

    // Initial load
    useEffect(() => {
        initCharts();
    }, [initCharts]);

    return (
        <>
            <div className="min-h-screen p-2 md:p-4 max-w-7xl mx-auto flex flex-col relative z-10 w-full text-slate-300">
                <Header
                    lang={lang}
                    onReset={initCharts}
                    onScan={runResonanceScan}
                    onBacktest={handleBacktest}
                    onOpenGuide={() => setIsGuideOpen(true)}
                    onOpenBrief={() => setIsBriefOpen(true)}
                    isScanning={isScanning}
                    isTacticalEnabled={isTacticalEnabled}
                    onToggleTactical={() => {
                        const newValue = !isTacticalEnabled;
                        setIsTacticalEnabled(newValue);
                        localStorage.setItem('tacticalRadarEnabled', newValue.toString());
                    }}
                    versionLabel="v5 (DEV MODE)"
                />

                <BacktestModal isOpen={isBacktestOpen} onClose={() => setIsBacktestOpen(false)} isRunning={isBacktesting} result={backtestResult} />
                <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} lang={lang} />
                <DailyBriefModalBilingual isOpen={isBriefOpen} onClose={() => setIsBriefOpen(false)} lang={lang} />
                <QuotaLimitModal
                    isOpen={isQuotaModalOpen}
                    onClose={() => setIsQuotaModalOpen(false)}
                    onUpgrade={onUpgrade}
                    isPremium={membership?.isPremium}
                    lang={lang}
                />

                {/* 【核心改变】左右调换：图表在左(col-span-9)，日志在右(col-span-3) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2 flex-grow">

                    {/* 左侧：图表区 - col-span-9 */}
                    <div className="lg:col-span-9 space-y-4">
                        {/* 资产选择器 */}
                        {/* 资产选择器 - 移动端单行优化版 */}
                        {/* 资产选择器 - 移动端双行布局，PC端单行 */}
                        <div className="bg-[#0a0a0c] border border-slate-800 p-2 rounded-sm flex flex-col md:flex-row gap-2 md:gap-4 justify-between items-stretch md:items-center backdrop-blur-sm shadow-xl mt-0">
                            <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide mask-linear-fade pr-0 md:pr-4 md:mr-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase px-1 whitespace-nowrap flex items-center gap-1 shrink-0">
                                    <Coins className="w-3 h-3" />
                                    <span className="hidden sm:inline">{lang === 'en' ? 'Target Asset:' : '目标资产:'}</span>
                                </span>
                                {presetCoins.map(coin => (
                                    <button
                                        key={coin.value}
                                        onClick={() => {
                                            setActiveSymbol(coin.value);
                                            localStorage.setItem('activeSymbol', coin.value);
                                            setShowSearchHint(true);
                                        }}
                                        className={`text-[10px] font-mono px-2 py-0.5 md:px-3 md:py-1 rounded-sm border transition-all whitespace-nowrap shrink-0 ${activeSymbol === coin.value
                                            ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400 font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                            : 'border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-200'
                                            }`}
                                    >
                                        {coin.label}
                                    </button>
                                ))}
                            </div>
                            <form onSubmit={handleCustomSymbolSubmit} className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                                <div className="flex-1 min-w-0 md:w-auto">
                                    <input
                                        type="text"
                                        value={customSymbol}
                                        onChange={(e) => setCustomSymbol(e.target.value)}
                                        placeholder={lang === 'en' ? "SYMBOL" : "代码"}
                                        className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] md:text-xs px-2 py-1.5 w-full md:w-32 rounded-sm focus:outline-none focus:border-yellow-600 font-mono uppercase placeholder:text-slate-600 transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={`p-1.5 rounded cursor-pointer transition-all flex items-center justify-center shrink-0 border ${customSymbol
                                        ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/20'
                                        : 'bg-transparent text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                                        }`}
                                    title={lang === 'en' ? "Search" : "搜索"}
                                >
                                    {customSymbol ? (
                                        <span className="text-[10px] font-bold px-2">{lang === 'en' ? 'GO' : '确认'}</span>
                                    ) : (
                                        <Search className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* AI 状态面板 */}
                        <StatusPanel
                            score={score}
                            result={aiResult}
                            lang={lang}
                            showSearchHint={showSearchHint}
                            symbol={activeSymbol}
                            onAutoFill={handleCreateOrder}
                        />

                        {/* 图表区域 - 安全条件渲染：useEffect后才决定 */}

                        {/* 初始状态(isDesktop===null)：显示loading占位 */}
                        {isDesktop === null && (
                            <div className="h-32 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center">
                                <div className="text-zinc-500 text-sm">{lang === 'zh' ? '正在加载...' : 'Loading...'}</div>
                            </div>
                        )}

                        {/* Desktop: Full Charts */}
                        {isDesktop === true && (
                            <div className="space-y-4 shadow-xl">
                                <ResonanceChart title={lang === 'en' ? `1M: Micro Field (${activeSymbol})` : `1M: 微观场 (${activeSymbol})`} meta="AI_NOISE" data={data1m} color="#22d3ee" isScanning={isScanning} showHit={showHit} enableTactical={false} />
                                <ResonanceChart title={lang === 'en' ? `5M: Structure Field (${activeSymbol})` : `5M: 结构场 (${activeSymbol})`} meta="WAVE_PATTERN" data={data5m} color="#a78bfa" isScanning={isScanning} showHit={showHit} enableTactical={false} />
                                <ResonanceChart title={lang === 'en' ? `1H: Macro Field (${activeSymbol})` : `1H: 宏观场 (${activeSymbol})`} meta="GRAVITY_WELL" data={data1h} color="#fbbf24" isScanning={isScanning} showHit={showHit} enableTactical={isTacticalEnabled} />
                            </div>
                        )}

                        {/* Mobile: Simplified Price Display */}
                        {isDesktop === false && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                                <div className="text-center mb-4">
                                    <div className="text-zinc-500 text-xs mb-1">{activeSymbol}</div>
                                    <div className="text-3xl font-bold text-amber-500">
                                        {data1h.length > 0 ? `$${data1h[data1h.length - 1]?.c?.toLocaleString() || '-'}` : '-'}
                                    </div>
                                    <div className="text-xs text-zinc-600 mt-1">{lang === 'zh' ? '图表仅在电脑端显示' : 'Charts on Desktop'}</div>
                                </div>
                                {/* RSI Quick View */}
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-slate-800/50 rounded p-2">
                                        <div className="text-[10px] text-zinc-500">1M RSI</div>
                                        <div className={`text-sm font-mono ${data1m.length > 0 && data1m[data1m.length - 1]?.rsi > 70 ? 'text-red-400' : data1m.length > 0 && data1m[data1m.length - 1]?.rsi < 30 ? 'text-green-400' : 'text-zinc-300'}`}>
                                            {data1m.length > 0 ? data1m[data1m.length - 1]?.rsi?.toFixed(1) || '-' : '-'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded p-2">
                                        <div className="text-[10px] text-zinc-500">5M RSI</div>
                                        <div className={`text-sm font-mono ${data5m.length > 0 && data5m[data5m.length - 1]?.rsi > 70 ? 'text-red-400' : data5m.length > 0 && data5m[data5m.length - 1]?.rsi < 30 ? 'text-green-400' : 'text-zinc-300'}`}>
                                            {data5m.length > 0 ? data5m[data5m.length - 1]?.rsi?.toFixed(1) || '-' : '-'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded p-2">
                                        <div className="text-[10px] text-zinc-500">1H RSI</div>
                                        <div className={`text-sm font-mono ${data1h.length > 0 && data1h[data1h.length - 1]?.rsi > 70 ? 'text-red-400' : data1h.length > 0 && data1h[data1h.length - 1]?.rsi < 30 ? 'text-green-400' : 'text-zinc-300'}`}>
                                            {data1h.length > 0 ? data1h[data1h.length - 1]?.rsi?.toFixed(1) || '-' : '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 右侧：系统日志 + 战术面板 (下) - col-span-3 */}
                    <div className="lg:col-span-3 space-y-6 flex flex-col">

                        {/* 系统日志 - 固定高度显示约10行 - 放到上面 */}
                        <div className="bg-[#0a0a0c]/80 border border-slate-800 p-4 rounded-sm flex-grow flex flex-col backdrop-blur-sm shadow-xl" style={{ maxHeight: '500px' }}>
                            <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-3 h-3 text-yellow-600" />
                                    {lang === 'en' ? 'SYSTEM LOG' : '系统日志 (SYSTEM LOG)'}
                                </div>
                                <button onClick={() => setLogs([])} className="hover:text-red-500 transition-colors p-1" title="清空日志">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 text-[10px] font-mono scrollbar-hide">
                                {logs.slice(-15).map((log) => (
                                    <div key={log.id} className={`${log.type === 'alert' ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}>
                                        <span className="opacity-30">[{log.timestamp.toLocaleTimeString('zh-CN', { hour12: false })}]</span> {log.message}
                                    </div>
                                ))}
                                <div ref={logsEndRef} />
                            </div>
                        </div>

                        {/* 战术面板 - 放到下面 */}
                        <TacticalPanel isEnabled={isTacticalEnabled} signals={tacticalSignals} isScanning={isScanning} lastUpdated={lastTacticalScanTime} lang={lang} />
                    </div>
                </div>
            </div>
        </>
    );
}
