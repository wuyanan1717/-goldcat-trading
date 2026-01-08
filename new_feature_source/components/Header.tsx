import React from 'react';
import { Zap, RefreshCw, History, HelpCircle, Eye, Microscope } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onScan: () => void;
  onBacktest: () => void;
  onOpenGuide: () => void;
  isScanning: boolean;
  isTacticalEnabled: boolean;
  onToggleTactical: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onReset, 
  onScan, 
  onBacktest, 
  onOpenGuide, 
  isScanning,
  isTacticalEnabled,
  onToggleTactical
}) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold italic tracking-tighter text-yellow-500 flex items-center gap-3">
          <span className="bg-yellow-500 text-black px-2 py-1 rounded-sm not-italic">G</span>
          GOLDCAT TERMINAL
          <span className="text-xs font-normal border border-yellow-500/30 px-2 py-0.5 rounded text-yellow-600 bg-yellow-500/5 font-mono">
            OBSERVER_NODE_2060
          </span>
        </h1>
        <p className="text-[10px] mt-2 tracking-[0.3em] text-slate-500 uppercase font-mono">
          接入块状宇宙 (Block Universe) // 确认因果律
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {/* Tactical Toggle */}
        <button
          onClick={onToggleTactical}
          className={`px-3 py-2 text-xs border rounded-sm uppercase transition-all flex items-center gap-2 ${
            isTacticalEnabled 
              ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]' 
              : 'border-slate-800 bg-transparent text-slate-500 hover:border-slate-600'
          }`}
          title="启用双重战术监控：平底绿(多) / 砍头红(空)"
        >
          <Microscope className="w-3 h-3" />
          {isTacticalEnabled ? '战术监控: ACTIVE' : '战术监控: OFF'}
        </button>

        <div className="w-px h-8 bg-slate-800 mx-2 hidden md:block"></div>

        <button 
          onClick={onOpenGuide}
          className="p-2 text-slate-500 hover:text-yellow-500 transition-colors"
          title="协议说明书"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        
        <button 
          onClick={onBacktest}
          disabled={isScanning}
          className="px-4 py-2 text-xs border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-sm uppercase transition-all flex items-center gap-2"
        >
          <History className="w-3 h-3" />
          回测 (Backtest)
        </button>
        <button 
          onClick={onReset}
          className="px-4 py-2 text-xs border border-slate-800 hover:bg-slate-900 text-slate-400 rounded-sm uppercase transition-all disabled:opacity-50 flex items-center gap-2"
          disabled={isScanning}
        >
          <RefreshCw className="w-3 h-3" />
          重置数据流
        </button>
        <button 
          onClick={onScan}
          disabled={isScanning}
          className={`px-6 py-2 text-sm font-bold text-black rounded-sm shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all flex items-center gap-2 ${
            isScanning ? 'bg-yellow-600 cursor-not-allowed opacity-80' : 'bg-yellow-500 hover:bg-yellow-400 hover:scale-105'
          }`}
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              观测中...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              启动观测
            </>
          )}
        </button>
      </div>
    </header>
  );
};