import React from 'react';
import { X, BookOpen, Brain, Zap, Activity } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-yellow-500" />
            观察者协议文档 (Protocol Guide)
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
          
          {/* Section 1: Déjà Vu */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm uppercase tracking-widest">
              <Brain className="w-4 h-4" />
              既视感 (Déjà Vu)
            </div>
            <p className="text-sm text-slate-400 leading-relaxed pl-6 border-l-2 border-slate-800">
              <strong className="text-slate-200">定义：</strong> 历史分形的相似度评分 (0-100%)。<br/>
              <strong className="text-slate-200">原理：</strong> 市场是由人类情绪构成的，人性不变，因此 K 线结构会不断重复。当系统检测到当前行情的“分形特征”与历史上某种大行情的特征高度重合时，该数值会飙升。<br/>
              <strong className="text-slate-200">判定：</strong> 分数 > 90% 代表“宿命重演”，建议重仓跟随。
            </p>
          </div>

          {/* Section 2: Resonance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-widest">
              <Zap className="w-4 h-4" />
              多周期共振 (Resonance)
            </div>
            <p className="text-sm text-slate-400 leading-relaxed pl-6 border-l-2 border-slate-800">
              <strong className="text-slate-200">定义：</strong> 1H (宏观)、5M (结构)、1M (情绪) 三个维度的方向统一。<br/>
              <strong className="text-slate-200">原理：</strong> 就像海浪（1M）叠加在潮汐（5M）之上，且顺应洋流（1H）。只有当三者合力指向同一方向时，才是阻力最小的路径。<br/>
              <strong className="text-slate-200">策略：</strong> 全红做空，全绿做多。
            </p>
          </div>

          {/* Section 3: Entropy & Divergence */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase tracking-widest">
              <Activity className="w-4 h-4" />
              熵增与背离 (Entropy & Divergence)
            </div>
            <p className="text-sm text-slate-400 leading-relaxed pl-6 border-l-2 border-slate-800">
              <strong className="text-slate-200">定义：</strong> 价格与动能 (RSI/Volume) 的逻辑断层。<br/>
              <strong className="text-slate-200">原理：</strong> 如果价格在上涨，但 RSI 指标却在下跌，说明“上涨的能量正在枯竭”，这是一种“虚假的繁荣”。观察者将其视为“因果律断层”，通常是剧烈反转的前兆。<br/>
              <strong className="text-slate-200">警报：</strong> 出现 BEARISH DIVERGENCE (顶背离) 时，即使趋势向上也不可追高，反而应寻找做空机会。
            </p>
          </div>

        </div>
        
        <div className="p-4 border-t border-slate-800 bg-black/20 text-[10px] text-slate-600 font-mono text-center">
          PROTOCOL_VER_2.0 // GOLDCAT_TERMINAL
        </div>
      </div>
    </div>
  );
};