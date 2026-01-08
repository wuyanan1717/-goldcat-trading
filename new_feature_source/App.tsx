import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Activity, Database, GitBranch, Sparkles, Search, Coins } from 'lucide-react';
import { Header } from './components/Header';
import { StatusPanel } from './components/StatusPanel';
import { TacticalPanel } from './components/TacticalPanel'; 
import { ResonanceChart } from './components/ResonanceChart';
import { BacktestModal } from './components/BacktestModal';
import { GuideModal } from './components/GuideModal';
import { fetchBinanceKlines, fetchBacktestData } from './utils/market';
import { consultObserver } from './utils/observer';
import { runBacktestSimulation, BacktestResult } from './utils/backtest';
import { detectFlatBottomGreen, detectBeheadingRed } from './utils/indicators';
import { LogEntry, ChartData, AIAnalysisResult, TacticalSignal } from './types'; 

const INITIAL_LOGS: LogEntry[] = [
  { id: 1, timestamp: new Date(), message: '正在初始化量子观察者终端 (Quantum Node)...', type: 'info' },
  { id: 2, timestamp: new Date(), message: '连接至加密数据流 (Binance Socket)...', type: 'info' },
];

const PRESET_COINS = [
    { label: 'BTC', value: 'BTCUSDT' },
    { label: 'ETH', value: 'ETHUSDT' },
    { label: 'SOL', value: 'SOLUSDT' },
    { label: 'DOGE', value: 'DOGEUSDT' },
    { label: 'PEPE', value: 'PEPEUSDT' },
    { label: 'SUI', value: 'SUIUSDT' },
];

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [score, setScore] = useState<number>(0); 
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showHit, setShowHit] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  
  // Symbol State
  const [activeSymbol, setActiveSymbol] = useState<string>('BTCUSDT');
  const [customSymbol, setCustomSymbol] = useState<string>('');

  // Feature Toggles & State
  const [isTacticalEnabled, setIsTacticalEnabled] = useState<boolean>(false);
  const [tacticalSignals, setTacticalSignals] = useState<TacticalSignal[]>([]); 
  const [lastTacticalScanTime, setLastTacticalScanTime] = useState<Date | null>(null);

  // Modals
  const [isBacktestOpen, setIsBacktestOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  // Visualization Data (Micro/Structure/Macro)
  const [data1m, setData1m] = useState<ChartData[]>([]);
  const [data5m, setData5m] = useState<ChartData[]>([]); 
  const [data1h, setData1h] = useState<ChartData[]>([]);

  // Background Monitoring Data (Strategic)
  const [data15m, setData15m] = useState<ChartData[]>([]);
  const [data4h, setData4h] = useState<ChartData[]>([]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string, type: 'info' | 'alert' = 'info') => {
    setLogs(prev => [
      ...prev,
      { id: Date.now(), timestamp: new Date(), message, type }
    ]);
  }, []);

  const initCharts = useCallback(async () => {
    addLog(`正在校准 ${activeSymbol} 时空向量...`, 'info');
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
        const currentPrice = d1m[d1m.length-1].v;
        addLog(`>>> 链路稳定 [${activeSymbol}]。价格: $${currentPrice.toLocaleString()}`, 'alert');
        addLog('等待观测指令 (Awaiting Observation)...', 'info');
      }
      
      setScore(0);
      setShowHit(false);
      setAiResult(null);
      // Reset tactical signals on symbol change to avoid confusion
      setTacticalSignals([]);
    } catch (e) {
      console.error(e);
      addLog(`错误：无法连接到 ${activeSymbol} 数据源。`, 'alert');
    }
  }, [addLog, activeSymbol]);

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

        const newSignals: TacticalSignal[] = [];
        
        const checkAndRecord = (data: ChartData[], timeframe: '15M' | '1H' | '4H') => {
            // 1. Check Flat Bottom Green (Bullish)
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

            // 2. Check Beheading Red (Bearish)
            const brIndices = detectBeheadingRed(data);
            const recentBr = brIndices.reverse().find(i => i >= data.length - 3);

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

  // --- Auto-Refresh Effect ---
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

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

  useEffect(() => {
    initCharts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSymbol]); // Re-run when symbol changes

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const runResonanceScan = async () => {
    if (isScanning) return;
    if (data1m.length === 0) {
      addLog('错误：无数据流...', 'alert');
      await initCharts();
      return;
    }

    setIsScanning(true);
    setShowHit(false);
    setScore(0);
    setAiResult(null);
    
    // 1. Resonance Scan (The "Quantum" part)
    addLog('测量市场纠缠态 (Entanglement Check)...', 'info');
    await new Promise(r => setTimeout(r, 600));
    
    // 2. Refresh tactical signals immediately on manual scan too
    if (isTacticalEnabled) {
      await runSilentTacticalScan();
    }

    addLog('计算波函数坍缩概率...', 'info');
    await new Promise(r => setTimeout(r, 800));
    addLog(`正在观测薛定谔的猫 [${activeSymbol}]...`, 'info');
    
    try {
      const analysis = await consultObserver(
        activeSymbol,
        data1m, 
        data5m, 
        data1h, 
        { tacticalSignals: tacticalSignals } // Pass full signal objects
      );
      setAiResult(analysis);
      
      addLog(analysis.quantum_phrase, 'info');
      await new Promise(r => setTimeout(r, 600));

      addLog(`观测完成。不确定性: ${analysis.uncertainty}%`, 'alert');
      addLog(`结论：“${analysis.conclusion}”`, 'alert');
      
      const strength = Math.abs(analysis.probability_up - 50) * 2;
      setScore(strength); 
      setShowHit(true);

    } catch (error) {
      console.error(error);
      addLog('观测失败，波函数退相干...', 'alert');
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

  const handleCustomSymbolSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(customSymbol.trim()) {
          const sym = customSymbol.toUpperCase().trim();
          // Simple validation or just let it try
          setActiveSymbol(sym);
          setCustomSymbol('');
      }
  };

  return (
    <>
    <div className="bg-stars"></div>
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col relative z-10">
      <Header 
        onReset={initCharts} 
        onScan={runResonanceScan} 
        onBacktest={handleBacktest}
        onOpenGuide={() => setIsGuideOpen(true)}
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
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2 flex-grow">
        {/* Left Panel: Status & Logs - col-span-4 */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          <StatusPanel score={score} result={aiResult} />
          
          <TacticalPanel 
            isEnabled={isTacticalEnabled} 
            signals={tacticalSignals} 
            isScanning={isScanning} 
            lastUpdated={lastTacticalScanTime}
          />
          
          <div className="bg-[#0a0a0c]/80 border border-slate-800 p-4 rounded-sm flex-grow min-h-[200px] flex flex-col backdrop-blur-sm">
            <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase flex items-center gap-2">
              <Terminal className="w-3 h-3 text-yellow-600" /> 
              系统日志 (SYSTEM LOG)
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

        {/* Right Panel: Charts - col-span-8 */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* ASSET SELECTOR BAR */}
          <div className="bg-[#0a0a0c] border border-slate-800 p-2 rounded-sm flex flex-col md:flex-row gap-3 justify-between items-center backdrop-blur-sm">
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-hide">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-2 whitespace-nowrap flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    目标资产:
                </span>
                {PRESET_COINS.map(coin => (
                    <button
                        key={coin.value}
                        onClick={() => setActiveSymbol(coin.value)}
                        className={`text-[10px] font-mono px-3 py-1 rounded-sm border transition-all whitespace-nowrap ${
                            activeSymbol === coin.value 
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
                        placeholder="输入代码 (如 APTUSDT)"
                        className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2 py-1 w-32 md:w-40 rounded-sm focus:outline-none focus:border-yellow-600 font-mono uppercase placeholder:text-slate-700"
                    />
                    <Search className="w-3 h-3 text-slate-600 absolute right-2 top-1.5 pointer-events-none group-focus-within:text-yellow-500" />
                 </div>
            </form>
          </div>

          <ResonanceChart 
            title={`1M: 微观场 (${activeSymbol})`}
            meta="QUANTUM_NOISE"
            data={data1m}
            color="#22d3ee" 
            isScanning={isScanning}
            showHit={showHit}
            enableTactical={false} 
          />
          <ResonanceChart 
            title={`5M: 结构场 (${activeSymbol})`}
            meta="WAVE_PATTERN"
            data={data5m}
            color="#a78bfa"
            isScanning={isScanning}
            showHit={showHit}
            enableTactical={false}
          />
          <ResonanceChart 
            title={`1H: 宏观场 (${activeSymbol})`}
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