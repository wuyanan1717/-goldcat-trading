/**
 * 实验性布局 V3 - 左右调换版
 * 
 * 改进：只是把系统日志从左边移到右边
 * 日志默认显示，固定 10 行高度
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Coins, Search, Trash2 } from 'lucide-react';
import { Header } from './components/Header';
import { StatusPanel } from './components/StatusPanel';
import { TacticalPanel } from './components/TacticalPanel';
import { ResonanceChart } from './components/ResonanceChart';
import { BacktestModal } from './components/BacktestModal';
import { GuideModal } from './components/GuideModal';
import { DailyBriefModalBilingual } from './components/DailyBriefModalBilingual';
import { QuotaLimitModal } from './components/QuotaLimitModal';
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

export default function TerminalAppV3({ lang, user, membership, onRequireLogin, onUpgrade }) {
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [score, setScore] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [showHit, setShowHit] = useState(false);
    const [aiResult, setAiResult] = useState(null);

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
                const formattedPrice = currentPrice < 1 ? currentPrice.toPrecision(8) : currentPrice.toLocaleString();
                addLog(lang === 'en' ? `>>> Link Stable [${activeSymbol}]. Price: $${formattedPrice}` : `>>> 链路稳定 [${activeSymbol}]。价格: $${formattedPrice}`, 'alert');
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
            intervalId = setInterval(() => runSilentTacticalScan(), 60000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [isTacticalEnabled, runSilentTacticalScan, addLog, activeSymbol]);

    useEffect(() => {
        addLog(lang === 'en' ? 'Quantum Observer Terminal Ready' : '量子观察者终端已就绪 (Quantum Observer Ready)', 'info');
        addLog(lang === 'en' ? 'Awaiting Observation Command...' : '等待观测指令... (Awaiting Observation Command)', 'info');
        initCharts();
    }, [addLog, initCharts, lang, activeSymbol]);

    // 【修复】自动滚动日志 (使用 scrollTop 避免整页跳动)
    useEffect(() => {
        if (logsEndRef.current && logsEndRef.current.parentElement) {
            const container = logsEndRef.current.parentElement;
            container.scrollTop = container.scrollHeight;
        }
    }, [logs]);

    const runResonanceScan = async () => {
        if (isScanning) return;
        if (!user) { onRequireLogin(); return; }
        if (data1m.length === 0) { addLog('错误：无数据流...', 'alert'); await initCharts(); return; }

        setIsScanning(true);
        setShowHit(false);
        setScore(0);
        setAiResult(null);
        setShowSearchHint(false);

        addLog(lang === 'en' ? 'Measuring Market Entanglement...' : '测量市场纠缠态 (Entanglement Check)...', 'info');
        await new Promise(r => setTimeout(r, 600));

        // --- 1. FORCE DATA REFRESH (Fix for Latency) ---
        addLog(lang === 'en' ? 'Synchronizing Real-time Quantum State...' : '同步实时量子场态数据...', 'info');
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
        addLog(lang === 'en' ? 'Calculating Wave Function Collapse...' : '计算波函数坍缩概率...', 'info');
        await new Promise(r => setTimeout(r, 800));
        addLog(lang === 'en' ? `Observing Schrödinger's Cat [${activeSymbol}]...` : `正在观测薛定谔的猫 [${activeSymbol}]...`, 'info');

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
            setShowHit(true);
        } catch (error) {
            console.error(error);
            addLog(lang === 'en' ? 'Observation Failed.' : '观测失败，波函数退相干...', 'alert');
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
            setBacktestResult(runBacktestSimulation(d1m, d5m, d1h));
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
            if (!commonQuotes.some(q => sym.endsWith(q)) && sym.length <= 12) sym += 'USDT';

            // Check if this coin is already in the preset list
            const existingIndex = presetCoins.findIndex(c => c.value === sym);

            if (existingIndex === -1) {
                // Feature: LIFO/FIFO Queue for Dynamic Slots
                // 1. Separate Fixed and Dynamic coins
                const fixedCoins = presetCoins.filter(c => c.fixed);
                const dynamicCoins = presetCoins.filter(c => !c.fixed);

                // 2. Add new coin to the FRONT of dynamic list (Most Recent)
                // Remove USDT suffix for display label
                const label = sym.replace(/USDT$|BUSD$|USDC$|BTC$|ETH$|DAI$/, '');
                dynamicCoins.unshift({ label, value: sym, fixed: false });

                // 3. Trim to maintain total slots (default 6: 2 Fixed + 4 Dynamic)
                const maxDynamicCount = 4;
                if (dynamicCoins.length > maxDynamicCount) {
                    dynamicCoins.pop(); // Remove the oldest (last one)
                }

                // 4. Recombine
                const newPresetCoins = [...fixedCoins, ...dynamicCoins];

                setPresetCoins(newPresetCoins);
                localStorage.setItem('presetCoins', JSON.stringify(newPresetCoins));
            }

            setActiveSymbol(sym);
            localStorage.setItem('activeSymbol', sym);
            setCustomSymbol('');
            setShowSearchHint(true);
        }
    };

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
                        <div className="bg-[#0a0a0c] border border-slate-800 p-2 rounded-sm flex flex-row gap-2 justify-between items-center backdrop-blur-sm shadow-xl mt-0">
                            <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide mask-linear-fade">
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
                            <form onSubmit={handleCustomSymbolSubmit} className="flex items-center gap-1 shrink-0">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={customSymbol}
                                        onChange={(e) => setCustomSymbol(e.target.value)}
                                        placeholder={lang === 'en' ? "SYMBOL" : "代码"}
                                        className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] md:text-xs px-2 py-1 w-20 md:w-40 rounded-sm focus:outline-none focus:border-yellow-600 font-mono uppercase placeholder:text-slate-600 transition-all focus:w-28 md:focus:w-40"
                                    />
                                    <button type="submit" className="absolute right-0.5 top-0.5 p-0.5 md:p-1 hover:bg-slate-800 rounded cursor-pointer text-slate-600 transition-all" title="加载">
                                        <Search className="w-3 h-3" />
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* AI 状态面板 */}
                        <StatusPanel score={score} result={aiResult} lang={lang} showSearchHint={showSearchHint} />

                        {/* 图表 */}
                        <ResonanceChart title={lang === 'en' ? `1M: Micro Field (${activeSymbol})` : `1M: 微观场 (${activeSymbol})`} meta="QUANTUM_NOISE" data={data1m} color="#22d3ee" isScanning={isScanning} showHit={showHit} enableTactical={false} />
                        <ResonanceChart title={lang === 'en' ? `5M: Structure Field (${activeSymbol})` : `5M: 结构场 (${activeSymbol})`} meta="WAVE_PATTERN" data={data5m} color="#a78bfa" isScanning={isScanning} showHit={showHit} enableTactical={false} />
                        <ResonanceChart title={lang === 'en' ? `1H: Macro Field (${activeSymbol})` : `1H: 宏观场 (${activeSymbol})`} meta="GRAVITY_WELL" data={data1h} color="#fbbf24" isScanning={isScanning} showHit={showHit} enableTactical={isTacticalEnabled} />
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
