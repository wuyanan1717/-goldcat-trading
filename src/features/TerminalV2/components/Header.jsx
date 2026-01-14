import React from 'react';
import { RefreshCw, History, HelpCircle, Eye, Microscope, Newspaper } from 'lucide-react';

export const Header = ({
    onReset,
    onScan,
    onBacktest,
    onOpenGuide,
    onOpenBrief,
    isScanning,
    isTacticalEnabled,
    onToggleTactical,
    lang = 'zh'
}) => {
    return (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-2 md:pb-3 mb-2 gap-3 md:gap-4">
            <div>
                <h1 className="text-xl md:text-3xl font-bold italic tracking-tighter text-yellow-500 flex items-center gap-2 md:gap-3">
                    <span className="bg-yellow-500 text-black px-1.5 py-0.5 md:px-2 md:py-1 rounded-sm not-italic text-sm md:text-base">G</span>
                    GOLDCAT TERMINAL
                    <span className="hidden sm:inline-block text-[10px] md:text-xs font-normal border border-yellow-500/30 px-1.5 py-0.5 rounded text-yellow-600 bg-yellow-500/5 font-mono">
                        OBSERVER_NODE_2060
                    </span>
                </h1>

            </div>
            <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                {/* Tactical Toggle */}
                <button
                    onClick={onToggleTactical}
                    className={`flex-1 md:flex-none justify-center px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs border rounded-sm uppercase transition-all flex items-center gap-1.5 md:gap-2 ${isTacticalEnabled
                        ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                        : 'border-slate-800 bg-transparent text-slate-500 hover:border-slate-600'
                        }`}
                    title={lang === 'en' ? "Enable Double Tactical Monitor: Flat Bottom Green / Beheading Red" : "启用双重战术监控：平底绿(多) / 砍头红(空)"}
                >
                    <Microscope className="w-3 h-3" />
                    <span className="hidden sm:inline">{isTacticalEnabled
                        ? (lang === 'en' ? 'Tactical: ACTIVE' : '战术监控: ACTIVE')
                        : (lang === 'en' ? 'Tactical: OFF' : '战术监控: OFF')}</span>
                    <span className="sm:hidden">{isTacticalEnabled ? 'TAC: ON' : 'TAC: OFF'}</span>
                </button>

                <div className="w-px h-6 bg-slate-800 mx-1 hidden md:block"></div>

                <div className="flex gap-2 flex-1 md:flex-none justify-end">
                    <button
                        onClick={onOpenGuide}
                        className="p-1.5 md:p-2 text-slate-500 hover:text-yellow-500 transition-colors"
                        title={lang === 'en' ? "Protocol Manual" : "协议说明书"}
                    >
                        <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <button
                        onClick={onBacktest}
                        disabled={isScanning}
                        className="px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-sm uppercase transition-all flex items-center gap-1.5 md:gap-2"
                    >
                        <History className="w-3 h-3" />
                        <span className="hidden sm:inline">{lang === 'en' ? 'Backtest' : '回测'}</span>
                    </button>
                    <button
                        onClick={onReset}
                        className="px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs border border-slate-800 hover:bg-slate-900 text-slate-400 rounded-sm uppercase transition-all disabled:opacity-50 flex items-center gap-1.5 md:gap-2"
                        disabled={isScanning}
                    >
                        <RefreshCw className="w-3 h-3" />
                        <span className="hidden sm:inline">{lang === 'en' ? 'Reset' : '重置'}</span>
                    </button>
                    <button
                        onClick={onScan}
                        disabled={isScanning}
                        className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-bold text-black rounded-sm shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all flex items-center gap-1.5 md:gap-2 ${isScanning ? 'bg-yellow-600 cursor-not-allowed opacity-80' : 'bg-yellow-500 hover:bg-yellow-400 hover:scale-105'
                            }`}
                    >
                        {isScanning ? (
                            <>
                                <RefreshCw className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                                <span className="hidden sm:inline">{lang === 'en' ? 'Scanning...' : '观测中...'}</span>
                                <span className="sm:hidden">{lang === 'en' ? 'Scan' : '观测'}</span>
                            </>
                        ) : (
                            <>
                                <Eye className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="hidden sm:inline">{lang === 'en' ? 'Start Scan' : '启动观测'}</span>
                                <span className="sm:hidden">{lang === 'en' ? 'Start' : '启动'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};
