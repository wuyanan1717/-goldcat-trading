import React from 'react';
import { AIAnalysisResult } from '../types';
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, Zap, Activity, Waves } from 'lucide-react';

interface StatusPanelProps {
  score: number; // Legacy prop, can ignore or use as backup
  result?: AIAnalysisResult | null;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ score, result }) => {
  
  const probability = result?.probability_up ?? 50;
  const uncertainty = result?.uncertainty ?? 0;
  
  // Quantum Signal Logic
  const renderSignal = () => {
    if (!result) return <span className="text-slate-700 font-mono text-xs animate-pulse">正在初始化量子传感器... (Initializing)</span>;
    
    switch (result.signal) {
      case 'LONG':
        return (
          <div className="flex items-center gap-3 text-green-500 animate-pulse-slow">
            <div className="w-10 h-10 border border-green-500/30 bg-green-500/10 rounded-sm flex items-center justify-center relative">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tighter text-green-400">多头坍缩 (LONG)</span>
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
              <span className="text-xl font-bold tracking-tighter text-red-400">空头坍缩 (SHORT)</span>
              <span className="text-[9px] text-red-500/50 uppercase tracking-widest font-mono">Wave Function Collapsed</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-3 text-yellow-500">
            <div className="w-10 h-10 border border-yellow-700 bg-yellow-900/20 rounded-sm flex items-center justify-center">
              <Waves className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tighter text-yellow-500">量子叠加态</span>
              <span className="text-[9px] text-yellow-600/50 uppercase tracking-widest font-mono">Superposition State</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
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
              波函数概率 (WAVE FUNCTION)
            </h3>
            <span className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1">
              {result?.quantum_phrase || 'CALCULATING...'}
            </span>
          </div>
          
          {/* Probability Bar */}
          <div className="relative h-8 w-full bg-slate-900 border border-slate-700 rounded-sm overflow-hidden mb-2">
            {/* Center Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-500/30 z-10"></div>
            
            {/* The Bar */}
            <div 
              className={`absolute top-0 bottom-0 transition-all duration-1000 ease-out ${
                probability > 50 ? 'left-1/2 bg-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'right-1/2 bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
              }`}
              style={{ width: `${Math.abs(probability - 50) * 2}%` }}
            ></div>
            
            {/* Text Overlay */}
            <div className="absolute inset-0 flex justify-between items-center px-2 z-20 font-mono text-[9px] font-bold">
               <span className={probability < 50 ? 'text-white' : 'text-slate-700'}>空头 (SHORT) {probability < 50 ? `${(50-probability)*2}%` : ''}</span>
               <span className={probability > 50 ? 'text-white' : 'text-slate-700'}>{probability > 50 ? `${(probability-50)*2}%` : ''} 多头 (LONG)</span>
            </div>
          </div>

          {/* Uncertainty Meter */}
          <div className="flex items-center gap-2 mt-3">
             <span className="text-[9px] text-slate-500 font-mono w-28">海森堡不确定性</span>
             <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-700"
                  style={{ width: `${uncertainty}%` }}
                ></div>
             </div>
             <span className="text-[9px] text-indigo-400 font-mono w-8 text-right">{uncertainty}%</span>
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
          观察者指令 (OBSERVER)
        </h3>
        
        <div className="mb-4 pl-2 border-l-2 border-slate-800">
          {renderSignal()}
        </div>

        {result?.action_advice && (
          <div className="mt-4 pt-3 border-t border-dashed border-slate-800/50">
             <p className="text-xs text-slate-400 font-mono leading-relaxed">
               <span className="text-yellow-600 font-bold mr-2">>>> 策略:</span>
               {result.action_advice}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};