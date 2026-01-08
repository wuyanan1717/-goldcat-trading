import React from 'react';
import { X, Activity, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { BacktestResult } from '../utils/backtest';

interface BacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRunning: boolean;
  result: BacktestResult | null;
}

export const BacktestModal: React.FC<BacktestModalProps> = ({ isOpen, onClose, isRunning, result }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-xl shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-yellow-500" />
            历史回溯系统 (Backtest)
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px] flex flex-col justify-center">
          {isRunning ? (
            <div className="text-center space-y-4">
              <Activity className="w-12 h-12 text-yellow-500 animate-spin mx-auto" />
              <p className="text-sm font-mono text-slate-400">正在重演过去 16 小时的时空结构...</p>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
                <div className="bg-yellow-500 h-full w-2/3 animate-scan"></div>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Long Stats */}
                <div className="bg-slate-800/30 p-4 rounded-lg border border-green-900/30 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="text-xs text-green-500 uppercase tracking-widest mb-2 font-bold flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    做多胜率 (Long)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{result.longStats.rate.toFixed(1)}%</span>
                    <span className="text-xs text-slate-500">
                      ({result.longStats.wins}/{result.longStats.wins + result.longStats.losses})
                    </span>
                  </div>
                </div>

                {/* Short Stats */}
                <div className="bg-slate-800/30 p-4 rounded-lg border border-red-900/30 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="text-xs text-red-500 uppercase tracking-widest mb-2 font-bold flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    做空胜率 (Short)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{result.shortStats.rate.toFixed(1)}%</span>
                    <span className="text-xs text-slate-500">
                      ({result.shortStats.wins}/{result.shortStats.wins + result.shortStats.losses})
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Return */}
              <div className="bg-black/40 p-3 rounded border border-slate-800 flex justify-between items-center">
                 <span className="text-xs text-slate-500 font-mono">策略总净值 (Total PnL)</span>
                 <span className={`font-mono font-bold text-lg ${result.totalReturn >= 0 ? 'text-yellow-500' : 'text-slate-400'}`}>
                   {result.totalReturn > 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                 </span>
              </div>

              {/* Logs */}
              <div className="space-y-1 font-mono text-[10px] bg-black/50 p-4 rounded border border-slate-800/50 max-h-32 overflow-y-auto custom-scrollbar">
                {result.logs.map((log, i) => (
                  <div key={i} className="text-slate-400 border-b border-slate-800/30 last:border-0 py-1 flex gap-2">
                    <span className="text-slate-600 select-none">&gt;</span>
                    {log}
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-slate-600 italic text-center">
                *注意：空头共振（崩塌模式）通常出现频率较低，但一旦确立，波动率往往极高。
              </div>
            </div>
          ) : (
             <div className="text-center text-slate-500">
                准备就绪
             </div>
          )}
        </div>
      </div>
    </div>
  );
};