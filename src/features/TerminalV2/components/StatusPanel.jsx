import React from 'react';
import { ArrowUpRight, ArrowDownRight, Zap, Activity, Waves, AlertTriangle, HelpCircle } from 'lucide-react';

import { translations } from '../../../translations';

export const StatusPanel = ({ score, result, lang = 'zh', showSearchHint = false }) => {

    // Add local state for animation control
    const [hasViewedGuide, setHasViewedGuide] = React.useState(false);

    React.useEffect(() => {
        const viewed = localStorage.getItem('goldcat_guide_viewed');
        if (viewed) setHasViewedGuide(true);
    }, []);

    const t = translations[lang]?.terminal || translations.zh.terminal;

    const probability = result?.probability_up ?? 50;
    const uncertainty = result?.uncertainty ?? 0;

    const handleOpenGuide = () => {
        setHasViewedGuide(true);
        localStorage.setItem('goldcat_guide_viewed', 'true');
        document.dispatchEvent(new CustomEvent('OPEN_GUIDE'));
    };

    // Quantum Signal Logic
    const renderSignal = () => {
        if (!result) {
            // Show search hint if user just searched
            if (showSearchHint) {
                return (
                    <div className="text-center py-4 px-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg animate-pulse">
                        <p className="text-yellow-400 text-sm font-bold mb-2">
                            {lang === 'zh' ? '👆 点击上方 "启动观测" 按钮开始分析' : '👆 Click "START SCAN" button above to analyze'}
                        </p>
                        <p className="text-yellow-600/60 text-xs">
                            {lang === 'zh' ? '已切换币种，需要重新观测' : 'Symbol changed, scan required'}
                        </p>
                    </div>
                );
            }
            return null; // Hide initializing state
        }

        switch (result.signal) {
            case 'LONG':
                return (
                    <div className="flex items-center gap-3 text-green-500 animate-pulse-slow">
                        <div className="w-10 h-10 border border-green-500/30 bg-green-500/10 rounded-sm flex items-center justify-center relative">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tighter text-green-400">{t.long_signal}</span>
                            <span className="text-[9px] text-green-500/50 uppercase tracking-widest font-mono">Wave Function Collapsed</span>
                        </div>
                    </div>
                );
            case 'SHORT':
                return (
                    <div className="flex items-center gap-3 text-red-500 animate-pulse-slow">
                        <div className="w-10 h-10 border border-red-500/30 bg-red-500/10 rounded-sm flex items-center justify-center relative">
                            <ArrowDownRight className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tighter text-red-400">{t.short_signal}</span>
                            <span className="text-[9px] text-red-500/50 uppercase tracking-widest font-mono">Wave Function Collapsed</span>
                        </div>
                    </div>
                );
            default:
                return null; // Hide Superposition State (user request)
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quantum State Panel */}
            <div className="bg-[#0a0a0c] border border-slate-800 p-1 relative overflow-hidden group">
                {/* Tech Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-yellow-600"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-yellow-600"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-yellow-600"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-yellow-600"></div>

                <div className="p-5 bg-gradient-to-b from-transparent to-yellow-900/5">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-[10px] font-bold text-yellow-600/70 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            {t.wave_function}
                        </h3>
                        {/* Animated Guide Button */}
                        <button
                            onClick={handleOpenGuide}
                            className="group relative"
                        >
                            {!hasViewedGuide && (
                                <div className="absolute inset-0 bg-yellow-500 rounded-full opacity-75 animate-ping"></div>
                            )}
                            <div className="relative bg-slate-900 text-yellow-500 rounded-full p-1 border border-yellow-500/50 hover:bg-yellow-500 hover:text-black transition-colors">
                                <HelpCircle className="w-4 h-4" />
                            </div>
                        </button>
                    </div>

                    {/* Probability Bar */}
                    <div className="relative h-8 w-full bg-slate-900 border border-slate-700 rounded-sm overflow-hidden mb-2">
                        {/* Center Line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-500/30 z-10"></div>

                        {/* The Bar */}
                        <div
                            className={`absolute top-0 bottom-0 transition-all duration-1000 ease-out ${probability > 50 ? 'left-1/2 bg-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'right-1/2 bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                                }`}
                            style={{ width: `${Math.abs(probability - 50) * 2}%` }}
                        ></div>

                        {/* Text Overlay */}
                        <div className="absolute inset-0 flex justify-between items-center px-2 z-20 font-mono text-[9px] font-bold">
                            <span className={probability < 50 ? 'text-white' : 'text-slate-700'}>{t.short} {probability < 50 ? `${(50 - probability) * 2}%` : ''}</span>
                            <span className={probability > 50 ? 'text-white' : 'text-slate-700'}>{probability > 50 ? `${(probability - 50) * 2}%` : ''} {t.long}</span>
                        </div>
                    </div>

                    {/* Confidence Meter (Inverted Uncertainty) */}
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-[9px] text-slate-500 font-mono w-28">{t.confidence}</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 transition-all duration-700"
                                style={{ width: `${100 - uncertainty}%` }}
                            ></div>
                        </div>
                        <span className="text-[9px] text-indigo-400 font-mono w-8 text-right">{100 - uncertainty}%</span>
                    </div>

                </div>
            </div>

            {/* Action Protocol Panel */}
            <div className="bg-[#0a0a0c] border border-slate-800 p-6 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5">
                    <Activity className="w-24 h-24 rotate-45" />
                </div>

                <h3 className="text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    {t.observer_instruction}
                </h3>

                <div className="mb-4 pl-2 border-l-2 border-slate-800">
                    {renderSignal()}

                    {/* ALWAYS SHOW METRICS IF RESULT EXISTS */}
                    {result && (
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            {/* 1. Déjà Vu */}
                            <div className="bg-slate-900/50 p-2 rounded-sm border border-slate-800">
                                <span className="text-[9px] text-slate-500 uppercase block mb-1">{lang === 'zh' ? '既视感' : 'Déjà Vu'}</span>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500" style={{ width: `${result.deja_vu || 0}%` }}></div>
                                </div>
                            </div>
                            {/* 2. Resonance */}
                            <div className="bg-slate-900/50 p-2 rounded-sm border border-slate-800">
                                <span className="text-[9px] text-slate-500 uppercase block mb-1">{lang === 'zh' ? '共振' : 'Resonance'}</span>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${result.resonance || 0}%` }}></div>
                                </div>
                            </div>
                            {/* 3. Entropy */}
                            <div className="bg-slate-900/50 p-2 rounded-sm border border-slate-800">
                                <span className="text-[9px] text-slate-500 uppercase block mb-1">{lang === 'zh' ? '熵增' : 'Entropy'}</span>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500" style={{ width: `${result.entropy || 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {result?.action_advice && (
                    <div className="mt-4 pt-3 border-t border-dashed border-slate-800/50">
                        <p className="text-xs text-slate-400 font-mono leading-relaxed">
                            <span className="text-yellow-600 font-bold mr-2">&gt;&gt;&gt; {t.strategy}</span>
                            {result.action_advice}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
