import React from 'react';
import { Microscope, AlertCircle, Clock, Crosshair, ShieldCheck, Activity, Skull } from 'lucide-react';
import { TacticalSignal } from '../types';

interface TacticalPanelProps {
  isEnabled: boolean;
  signals: TacticalSignal[];
  isScanning: boolean;
  lastUpdated: Date | null;
}

export const TacticalPanel: React.FC<TacticalPanelProps> = ({ isEnabled, signals, isScanning, lastUpdated }) => {
  if (!isEnabled) return null;

  return (
    <div className="bg-[#0a0a0c] border border-slate-800 rounded-sm relative overflow-hidden group transition-all duration-500">
      {/* Header */}
      <div className="bg-slate-900/50 p-3 border-b border-slate-800 flex justify-between items-center">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          战术雷达 (TACTICAL OPS)
        </h3>
        <div className="flex items-center gap-2">
          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded-full">
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] text-slate-400 font-mono tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      <div className="p-4 min-h-[100px] flex flex-col justify-center">
        {signals.length === 0 ? (
          <div className="text-center space-y-2 py-2">
            <Activity className="w-6 h-6 text-slate-800 mx-auto animate-pulse" />
            <p className="text-[10px] text-slate-600 font-mono">
              监视形态: 平底绿 (LONG) / 砍头红 (SHORT)
            </p>
            <p className="text-xs text-slate-500">
              {isScanning ? "正在扫描时空结构..." : "暂未发现特定战术形态"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((sig) => {
              const isBullish = sig.type === 'FLAT_BOTTOM_GREEN';
              const colorClass = isBullish ? 'green' : 'red';
              const borderColor = isBullish ? 'border-green-500/30' : 'border-red-500/30';
              const bgColor = isBullish ? 'bg-green-500/5' : 'bg-red-500/5';
              const textColor = isBullish ? 'text-green-400' : 'text-red-400';
              const tagBg = isBullish ? 'bg-green-500' : 'bg-red-500';

              return (
                <div 
                  key={sig.id} 
                  className={`${bgColor} ${borderColor} border p-3 rounded-sm relative overflow-hidden animate-in slide-in-from-left duration-500`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${tagBg}`}></div>
                  
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2">
                        <span className={`${tagBg} text-black text-[10px] font-bold px-1.5 py-0.5 rounded-sm`}>
                          {sig.timeframe}
                        </span>
                        <span className={`${textColor} font-bold text-xs tracking-tight`}>
                          {isBullish ? '平底绿形态确认' : '砍头红形态确认'}
                        </span>
                     </div>
                     <span className={`text-[9px] ${isBullish ? 'text-green-600' : 'text-red-600'} font-mono border ${isBullish ? 'border-green-900/50' : 'border-red-900/50'} px-1 rounded`}>
                        {isBullish ? 'STRONG_FORCE' : 'KILL_ZONE'}
                     </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span>{new Date(sig.timestamp).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Crosshair className="w-3 h-3 text-slate-600" />
                      <span className="text-slate-200">${sig.price.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className={`mt-2 pt-2 border-t ${isBullish ? 'border-green-500/10 text-green-500/70' : 'border-red-500/10 text-red-500/70'} text-[9px] italic`}>
                    {isBullish ? '>>> 多头绝对防守，建议关注突破。' : '>>> 十字星破位，空头动能释放，注意止损。'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="bg-black/20 p-2 border-t border-slate-800 flex justify-between items-center text-[9px] font-mono text-slate-600">
        <span>AUTO_SCAN: ON</span>
        <span>
            UPDATED: {lastUpdated ? lastUpdated.toLocaleTimeString('zh-CN', { hour12: false }) : '--:--:--'}
        </span>
      </div>
    </div>
  );
};