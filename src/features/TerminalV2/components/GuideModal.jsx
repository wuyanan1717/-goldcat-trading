import React from 'react';
import { X, BookOpen, Brain, Zap, Activity, ShieldCheck } from 'lucide-react';

export const GuideModal = ({ isOpen, onClose, lang = 'zh' }) => {
    if (!isOpen) return null;

    const CONTENT = {
        zh: {
            title: "观察者协议文档 (Protocol Guide)",

            // ... (keep existing sections) ...
            wave_title: "波函数概率 (Wave Function & AI Confidence)",
            wave_def: "定义：",
            wave_def_text: "市场未来方向的坍缩概率。",
            wave_principle: "原理：",
            wave_principle_text: "AI 基于“既视感”、“共振”、“熵增”三个维度进行综合计算，模拟无数个平行宇宙的走势。当 80% 的平行宇宙都指向“上涨”时，多头概率条就会显示 80%。",
            wave_conf: "AI 确信度：",
            wave_conf_text: "代表 AI 对这次判断的“自信程度”。如果确信度很低（如 30%），即使多头概率很高，也说明市场噪音极大，建议观望。",

            tactical_title: "战术监控 (Tactical Ops)",
            tactical_def: "定义：",
            tactical_def_text: "实时扫描特定的反转 K 线形态。",
            tactical_fbg: "底部反转 (Flat Bottom Green):",
            tactical_fbg_text: "GoldCat 核心算法捕获的特殊做多信号。通过分析微观市场的买单堆积特征，识别主力资金在关键点位的介入痕迹。",
            tactical_br: "顶部抛压 (Beheading Red):",
            tactical_br_text: "GoldCat 量子雷达追踪到的高危做空信号。揭示了市场情绪的瞬间崩塌与多头动能的枯竭，通常预示着趋势的剧烈反转。",
            tactical_auto: "自动巡航：",
            tactical_auto_text: "该功能开启后，系统会每 60 秒自动扫描一次，无需手动刷新。",

            deja_title: "既视感 (Déjà Vu)",
            deja_def: "定义：",
            deja_def_text: "历史分形的相似度评分 (0-100%)。",
            deja_principle: "原理：",
            deja_principle_text: "市场是由人类情绪构成的，人性不变，因此 K 线结构会不断重复。当系统检测到当前行情的“分形特征”与历史上某种大行情的特征高度重合时，该数值会飙升。",
            deja_judge: "判定：",
            deja_judge_text: "分数 > 90% 代表“宿命重演”，建议重仓跟随。",

            res_title: "多周期共振 (Resonance)",
            res_def: "定义：",
            res_def_text: "1H (宏观)、5M (结构)、1M (情绪) 三个维度的方向统一。",
            res_principle: "原理：",
            res_principle_text: "就像海浪（1M）叠加在潮汐（5M）之上，且顺应洋流（1H）。只有当三者合力指向同一方向时，才是阻力最小的路径。",
            res_strat: "策略：",
            res_strat_text: "全红做空，全绿做多。",

            ent_title: "熵增与背离 (Entropy & Divergence)",
            ent_def: "定义：",
            ent_def_text: "价格与动能 (RSI/Volume) 的逻辑断层。",
            ent_principle: "原理：",
            ent_principle_text: "如果价格在上涨，但 RSI 指标却在下跌，说明“上涨的能量正在枯竭”，这是一种“虚假的繁荣”。观察者将其视为“因果律断层”，通常是剧烈反转的前兆。",
            ent_alert: "警报：",
            ent_alert_text: "出现 BEARISH DIVERGENCE (顶背离) 时，即使趋势向上也不可追高，反而应寻找做空的机会。",

            // Updated Legal Section
            ip_title: "5. 知识产权",
            ip_text: "服务及其原始内容、功能和特性归 GoldCat Terminal 所有。您的交易数据归您所有，您保留对其的所有权利。",

            disclaimer_title: "6. 免责声明",
            disclaimer_note: "重要提示：",
            disclaimer_points: [
                "本服务不构成投资建议或财务咨询",
                "交易涉及重大风险，您可能损失投资",
                "过往表现不代表未来结果",
                "您应自行承担所有交易决策的后果",
                "我们不对基于本服务做出的任何投资决策负责"
            ]
        },
        en: {
            title: "Observer Protocol Guide",

            wave_title: "Wave Function & AI Confidence",
            wave_def: "Definition:",
            wave_def_text: "Probability of the market's future direction collapsing.",
            wave_principle: "Principle:",
            wave_principle_text: "AI calculates based on 'Déjà Vu', 'Resonance', and 'Entropy'. It simulates countless parallel universes. If 80% point 'Up', the Long bar shows 80%.",
            wave_conf: "AI Confidence:",
            wave_conf_text: "Represents the AI's confidence in this judgment. Low confidence (e.g. 30%) means high market noise; observation is recommended over action.",

            tactical_title: "Tactical Ops",
            tactical_def: "Definition:",
            tactical_def_text: "Real-time scanning for specific reversal candlestick patterns.",
            tactical_fbg: "Flat Bottom Green:",
            tactical_fbg_text: "A proprietary bullish signal detected by GoldCat's Core Algorithm. It identifies the footprint of institutional accumulation through micro-market analysis.",
            tactical_br: "Beheading Red:",
            tactical_br_text: "A high-risk bearish signal tracked by GoldCat's Quantum Radar. It reveals the instantaneous collapse of sentiment and exhaustion of bullish momentum.",
            tactical_auto: "Auto-Cruise:",
            tactical_auto_text: "When enabled, the system automatically scans every 60 seconds without manual refresh.",

            deja_title: "Déjà Vu",
            deja_def: "Definition:",
            deja_def_text: "Similarity score of historical fractals (0-100%).",
            deja_principle: "Principle:",
            deja_principle_text: "Markets are driven by human emotion, which never changes. Thus, structures repeat. This value spikes when current patterns match major historical moves.",
            deja_judge: "Verdict:",
            deja_judge_text: "Score > 90% indicates 'Fate Replay' - strong follow signal.",

            res_title: "Resonance",
            res_def: "Definition:",
            res_def_text: "Alignment of 1H (Macro), 5M (Structure), and 1M (Sentiment).",
            res_principle: "Principle:",
            res_principle_text: "Like waves (1M) riding tides (5M) following currents (1H). The path of least resistance exists only when all three align.",
            res_strat: "Strategy:",
            res_strat_text: "All Red = Short, All Green = Long.",

            ent_title: "Entropy & Divergence",
            ent_def: "Definition:",
            ent_def_text: "Logical break between Price and Momentum (RSI/Volume).",
            ent_principle: "Principle:",
            ent_principle_text: "Price rising while RSI falls indicates 'exhausted energy' and 'fake prosperity'. The Observer sees this as a causality break, often preceding sharp reversals.",
            ent_alert: "Alert:",
            ent_alert_text: "BEARISH DIVERGENCE warning: Do not chase highs. Look for short opportunities instead.",

            // Updated Legal Section
            ip_title: "5. Intellectual Property",
            ip_text: "The Service and its original content, features, and functionality are owned by GoldCat Terminal. Your trading data belongs to you, and you retain all rights to it.",

            disclaimer_title: "6. Disclaimer",
            disclaimer_note: "Important Note:",
            disclaimer_points: [
                "This service does not constitute investment advice or financial consultation",
                "Trading involves significant risk, and you may lose your investment",
                "Past performance is not indicative of future results",
                "You are solely responsible for all consequences of your trading decisions",
                "We are not responsible for any investment decisions made based on this service"
            ]
        }
    };

    const t = CONTENT[lang] || CONTENT.zh;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-yellow-500" />
                        {t.title}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                    {/* Section 1: Wave Function Probability */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-orange-400 font-bold text-sm uppercase tracking-widest">
                            <Zap className="w-4 h-4" />
                            {t.wave_title}
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed pl-6 border-l-2 border-slate-800">
                            <strong className="text-slate-200">{t.wave_def}</strong> {t.wave_def_text}<br />
                            <strong className="text-slate-200">{t.wave_principle}</strong> {t.wave_principle_text}<br />
                            <strong className="text-slate-200">{t.wave_conf}</strong> {t.wave_conf_text}
                        </p>
                    </div>

                    {/* Section 2: Tactical Ops */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-400 font-bold text-sm uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4" />
                            {t.tactical_title}
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed pl-6 border-l-2 border-slate-800">
                            <strong className="text-slate-200">{t.tactical_def}</strong> {t.tactical_def_text}<br />
                            <strong className="text-slate-200">{t.tactical_fbg}</strong> {t.tactical_fbg_text}<br />
                            <strong className="text-slate-200">{t.tactical_br}</strong> {t.tactical_br_text}<br />
                            <strong className="text-slate-200">{t.tactical_auto}</strong> {t.tactical_auto_text}
                        </p>
                    </div>

                    {/* Section 3: Déjà Vu */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm uppercase tracking-widest">
                            <Brain className="w-4 h-4" />
                            {t.deja_title}
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed pl-6 border-l-2 border-slate-800">
                            <strong className="text-slate-200">{t.deja_def}</strong> {t.deja_def_text}<br />
                            <strong className="text-slate-200">{t.deja_principle}</strong> {t.deja_principle_text}<br />
                            <strong className="text-slate-200">{t.deja_judge}</strong> {t.deja_judge_text}
                        </p>
                    </div>

                    {/* Section 4: Resonance */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-widest">
                            <Zap className="w-4 h-4" />
                            {t.res_title}
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed pl-6 border-l-2 border-slate-800">
                            <strong className="text-slate-200">{t.res_def}</strong> {t.res_def_text}<br />
                            <strong className="text-slate-200">{t.res_principle}</strong> {t.res_principle_text}<br />
                            <strong className="text-slate-200">{t.res_strat}</strong> {t.res_strat_text}
                        </p>
                    </div>

                    {/* Section 5: Entropy & Divergence */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase tracking-widest">
                            <Activity className="w-4 h-4" />
                            {t.ent_title}
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed pl-6 border-l-2 border-slate-800">
                            <strong className="text-slate-200">{t.ent_def}</strong> {t.ent_def_text}<br />
                            <strong className="text-slate-200">{t.ent_principle}</strong> {t.ent_principle_text}<br />
                            <strong className="text-slate-200">{t.ent_alert}</strong> {t.ent_alert_text}
                        </p>
                    </div>

                    {/* Intellectual Property */}
                    <div className="space-y-2 mt-8 pt-6 border-t border-slate-800/50">
                        <h4 className="text-white font-bold text-sm uppercase">{t.ip_title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            {t.ip_text}
                        </p>
                    </div>

                    {/* Disclaimer */}
                    <div className="space-y-2 pb-4">
                        <h4 className="text-white font-bold text-sm uppercase">{t.disclaimer_title}</h4>
                        <div className="text-xs text-slate-400 leading-relaxed">
                            <p className="mb-2">{t.disclaimer_note}</p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-500">
                                {t.disclaimer_points.map((point, index) => (
                                    <li key={index}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t border-slate-800 bg-black/20 text-[10px] text-slate-600 font-mono text-center">
                    PROTOCOL_VER_2.0 // GOLDCAT_TERMINAL
                </div>
            </div>
        </div>
    );
};
