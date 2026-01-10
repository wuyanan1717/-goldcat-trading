import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Coins, Search, Trash2 } from 'lucide-react';
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

export default function TerminalApp({ lang, user, membership, onRequireLogin, onUpgrade }) {
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [score, setScore] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [showHit, setShowHit] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    // Symbol State
    const [activeSymbol, setActiveSymbol] = useState('BTCUSDT');
    const [customSymbol, setCustomSymbol] = useState('');
    const [presetCoins, setPresetCoins] = useState(INITIAL_PRESET_COINS);
    const [showSearchHint, setShowSearchHint] = useState(false);

    // Feature Toggles & State
    const [isTacticalEnabled, setIsTacticalEnabled] = useState(false);

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
            return newLogs.slice(-100); // Auto-truncate to last 100
        });
    }, []);

    const initCharts = useCallback(async () => {
        // Don't set isScanning here - only load data silently on init/symbol change
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
                // Fix for small value coins like PEPE showing as $0
                const formattedPrice = currentPrice < 1
                    ? currentPrice.toPrecision(8) // Show more precision for small numbers
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
            // Reset tactical signals on symbol change to avoid confusion
            setTacticalSignals([]);
        } catch (e) {
            console.error(e);
            addLog(lang === 'en' ? `Error: Connection Failed for ${activeSymbol}` : `错误：无法连接到 ${activeSymbol} 数据源。`, 'alert');
        }
    }, [addLog, activeSymbol, lang]);

    // --- Silent Background Scan Logic ---
    const runSilentTacticalScan = useCallback(async () => {
        try {
            // Fetch fresh strategic data
            const [d15m, d1h, d4h] = await Promise.all([
                fetchBinanceKlines(activeSymbol, '15m', 50),
                fetchBinanceKlines(activeSymbol, '1h', 50),
                fetchBinanceKlines(activeSymbol, '4h', 50)
            ]);

            // Update strategic data state
            setData15m(d15m);
            setData4h(d4h);

            const newSignals = [];

            const checkAndRecord = (data, timeframe) => {
                // 1. Check Flat Bottom Green (Bullish)
                const fbgIndices = detectFlatBottomGreen(data);
                // Widen window to last 12 candles to show recent signals in radar that are visible on chart
                const recentFbg = fbgIndices.reverse().find(i => i >= data.length - 12);

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

                // 2. Check Beheading Red (Bearish)
                const brIndices = detectBeheadingRed(data);
                // Widen window to last 12 candles
                const recentBr = brIndices.reverse().find(i => i >= data.length - 12);

                if (recentBr !== undefined) {
                    const candle = data[recentBr];
                    newSignals.push({
                        id: `BR-${timeframe}-${candle.time}`,
                        timeframe: timeframe,
                        type: 'BEHEADING_RED',
                        price: candle.v, // Close price is relevant for drop
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

    // --- Event Listeners ---
    useEffect(() => {
        const handleOpenGuide = () => setIsGuideOpen(true);
        document.addEventListener('OPEN_GUIDE', handleOpenGuide);
        return () => document.removeEventListener('OPEN_GUIDE', handleOpenGuide);
    }, []);

    // --- Auto-Refresh Effect ---
    useEffect(() => {
        let intervalId;

        if (isTacticalEnabled) {
            addLog(`>>> 战术监控 [${activeSymbol}] 已激活...`, 'info');
            // Run immediately
            runSilentTacticalScan();

            // Set interval 60s
            intervalId = setInterval(() => {
                runSilentTacticalScan();
            }, 60000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isTacticalEnabled, runSilentTacticalScan, addLog, activeSymbol]);

    // Initial Greeting and Chart Load
    useEffect(() => {
        addLog(lang === 'en' ? 'Quantum Observer Terminal Ready' : '量子观察者终端已就绪 (Quantum Observer Ready)', 'info');
        addLog(lang === 'en' ? 'Awaiting Observation Command...' : '等待观测指令... (Awaiting Observation Command)', 'info');
        initCharts();
    }, [addLog, initCharts, lang, activeSymbol]); // activeSymbol added to dependency array for initCharts

    // Auto-scroll logs ONLY when actively scanning (not on initial load)
    useEffect(() => {
        if (logsEndRef.current && isScanning) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isScanning]);

    const runResonanceScan = async () => {
        if (isScanning) return;

        // 1. Enforce Login
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
        setShowSearchHint(false); // Hide search hint when scan starts

        // 1. Resonance Scan (The "Quantum" part)
        addLog(lang === 'en' ? 'Measuring Market Entanglement...' : '测量市场纠缠态 (Entanglement Check)...', 'info');
        await new Promise(r => setTimeout(r, 600));

        // 2. Refresh tactical signals immediately on manual scan too
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
                { tacticalSignals: tacticalSignals }, // Pass full signal objects
                lang // Pass language for consistent AI response
            );

            // 2. Handle Limits
            if (analysis.quantum_phrase === 'LIMIT_EXCEEDED' || analysis.quantum_phrase === 'DAILY_LIMIT_REACHED') {
                const isPremium = membership?.isPremium;
                const message = isPremium
                    ? (lang === 'en' ? "Daily Limit Reached (20/20).\nPlease come back tomorrow." : "今日观测次数已达上限 (20/20)。\n请明日再来。")
                    : (lang === 'en' ? "Free Limit Reached (2/2).\nUpgrade to PRO for 20 daily scans + more features!" : "免费观测次数已耗尽 (2/2)。\n升级 PRO 会员解锁每日 20 次观测 + 更多特权！");

                if (!isPremium) {
                    if (window.confirm(message)) {
                        onUpgrade();
                    }
                } else {
                    alert(message);
                }

                addLog(analysis.conclusion, 'alert');
                return; // Stop processing
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
                : `结论：“${analysis.conclusion}”`;
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
            // Pass active symbol to backtest fetcher
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

            // Smart Auto-Completion: Helper for users who just type "DOGE" or "BONK"
            // If no quote currency is detected, default to USDT
            const commonQuotes = ['USDT', 'BUSD', 'USDC', 'BTC', 'ETH', 'DAI'];
            const hasQuote = commonQuotes.some(q => sym.endsWith(q));

            if (!hasQuote && sym.length <= 12) { // Increased limit to support "1000BONK" etc.
                sym += 'USDT';
            }

            console.log('🔍 Searching for:', sym);
            console.log('📋 Current preset coins:', presetCoins);

            // Check if this coin is already in the preset list
            const existingIndex = presetCoins.findIndex(c => c.value === sym);
            console.log('🔎 Existing index:', existingIndex);

            if (existingIndex === -1) {
                // New coin - replace the last replaceable coin (not BTC/ETH)
                const newPresetCoins = [...presetCoins];

                // Find the last replaceable coin (from the end, excluding fixed ones)
                for (let i = newPresetCoins.length - 1; i >= 0; i--) {
                    if (!newPresetCoins[i].fixed) {
                        // Extract label from symbol (remove USDT suffix)
                        const label = sym.replace(/USDT$|BUSD$|USDC$|BTC$|ETH$|DAI$/, '');
                        console.log(`🔄 Replacing position ${i}: ${newPresetCoins[i].label} → ${label}`);
                        newPresetCoins[i] = { label, value: sym, fixed: false };
                        break;
                    }
                }

                console.log('✅ New preset coins:', newPresetCoins);
                setPresetCoins(newPresetCoins);
            } else {
                console.log('ℹ️ Coin already exists in list');
            }

            setActiveSymbol(sym);
            setCustomSymbol('');
            setShowSearchHint(true); // Show hint after searching
        }
    };

    return (
        <>
            <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col relative z-10 w-full text-slate-300">
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2 flex-grow">
                    {/* Left Panel: Tactical & Logs - col-span-3 (Narrower) */}
                    <div className="lg:col-span-3 space-y-6 flex flex-col">
                        {/* Moved StatusPanel out to Main Area */}

                        <TacticalPanel
                            isEnabled={isTacticalEnabled}
                            signals={tacticalSignals}
                            isScanning={isScanning}
                            lastUpdated={lastTacticalScanTime}
                            lang={lang}
                        />

                        <div className="bg-[#0a0a0c]/80 border border-slate-800 p-4 rounded-sm flex-grow min-h-[200px] flex flex-col backdrop-blur-sm shadow-xl">
                            <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-3 h-3 text-yellow-600" />
                                    {lang === 'en' ? 'SYSTEM LOG' : '系统日志 (SYSTEM LOG)'}
                                </div>
                                <button
                                    onClick={() => setLogs([])}
                                    className="hover:text-red-500 transition-colors p-1"
                                    title="清空日志"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 text-[10px] font-mono scrollbar-hide">
                                {logs.map((log) => (
                                    <div key={log.id} className={`${log.type === 'alert' ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}>
                                        <span className="opacity-30">[{log.timestamp.toLocaleTimeString('zh-CN', { hour12: false })}]</span> {log.message}
                                    </div>
                                ))}
                                <div ref={logsEndRef} />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Charts & AI Status - col-span-9 (Wider) */}
                    <div className="lg:col-span-9 space-y-4">

                        {/* ASSET SELECTOR BAR */}
                        <div className="bg-[#0a0a0c] border border-slate-800 p-2 rounded-sm flex flex-col md:flex-row gap-3 justify-between items-center backdrop-blur-sm shadow-xl">
                            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-hide">
                                <span className="text-[10px] font-bold text-slate-500 uppercase px-2 whitespace-nowrap flex items-center gap-1">
                                    <Coins className="w-3 h-3" />
                                    {lang === 'en' ? 'Target Asset:' : '目标资产:'}
                                </span>
                                {presetCoins.map(coin => (
                                    <button
                                        key={coin.value}
                                        onClick={() => { setActiveSymbol(coin.value); setShowSearchHint(true); }}
                                        className={`text-[10px] font-mono px-3 py-1 rounded-sm border transition-all whitespace-nowrap ${activeSymbol === coin.value
                                            ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400 font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                            : 'border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-200'
                                            }`}
                                    >
                                        {coin.label}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleCustomSymbolSubmit} className="flex items-center gap-1 w-full md:w-auto">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={customSymbol}
                                        onChange={(e) => setCustomSymbol(e.target.value)}
                                        placeholder={lang === 'en' ? "Symbol (e.g. BONK)" : "代码"}
                                        className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2 py-1 w-32 md:w-40 rounded-sm focus:outline-none focus:border-yellow-600 font-mono uppercase placeholder:text-slate-600"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-1 top-1 p-1 hover:bg-slate-800 rounded cursor-pointer group-focus-within:text-yellow-500 text-slate-600 transition-all"
                                        title="加载数据"
                                    >
                                        <Search className="w-3 h-3" />
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Top Section: AI Status (Side-by-Side internally)            {/* 1. Status Panel (AI Analysis) */}
                        <StatusPanel score={score} result={aiResult} lang={lang} showSearchHint={showSearchHint} />

                        {/* Middle: 1M Micro Field */}
                        <ResonanceChart
                            title={lang === 'en' ? `1M: Micro Field (${activeSymbol})` : `1M: 微观场 (${activeSymbol})`}
                            meta="QUANTUM_NOISE"
                            data={data1m}
                            color="#22d3ee"
                            isScanning={isScanning}
                            showHit={showHit}
                            enableTactical={false}
                        />

                        {/* Middle: 5M Structure */}
                        <ResonanceChart
                            title={lang === 'en' ? `5M: Structure Field (${activeSymbol})` : `5M: 结构场 (${activeSymbol})`}
                            meta="WAVE_PATTERN"
                            data={data5m}
                            color="#a78bfa"
                            isScanning={isScanning}
                            showHit={showHit}
                            enableTactical={false}
                        />

                        {/* Bottom: 1H Macro */}
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
            </div>
        </>
    );
}
