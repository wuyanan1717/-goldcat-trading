import React from 'react';
import { X, BookOpen, Brain, Zap, Activity, ShieldCheck } from 'lucide-react';

export const GuideModal = ({ isOpen, onClose, lang = 'zh' }) => {
    if (!isOpen) return null;

    const CONTENT = {
        zh: {
            title: "观察者协议文档 (Protocol Guide)",

            wave_title: "核心机制：多周期共振 (Resonance)",
            wave_def: "定义：",
            wave_def_text: "系统同时观察 1H（大方向）、5M（结构节奏）、1M（短线波动），判断三个周期是否同向。",
            wave_principle: "原理：",
            wave_principle_text: "三个周期越一致，信号越稳定；周期越分歧，信号越容易反复。系统会把这种一致性转成可读信号，帮助你做节奏判断。",
            wave_conf: "使用建议：",
            wave_conf_text: "建议把共振信号用于“辅助判断”，并结合仓位管理、止损规则与多源信息，不建议单点依赖。",

            tactical_title: "信号解读（简化版）",
            tactical_def: "定义：",
            tactical_def_text: "系统输出的是基于历史数据模式匹配后的方向性参考，不是确定性预测。",
            tactical_fbg: "多头信号：",
            tactical_fbg_text: "表示历史上相似结构中，上行场景较常见，但不代表未来必然上涨。",
            tactical_br: "空头信号：",
            tactical_br_text: "表示历史上相似结构中，下行场景较常见，但不代表未来必然下跌。",
            tactical_auto: "自动巡航：",
            tactical_auto_text: "系统按固定频率更新信号，行情快速变化时请以交易所实时盘口为准。",

            deja_title: "模型边界说明",
            deja_def: "定义：",
            deja_def_text: "AI 的判断来自历史样本与参数计算，不具备对未来事件的确定性预测能力。",
            deja_principle: "原理：",
            deja_principle_text: "市场会出现重复结构，但每次出现的环境、流动性、消息面都可能不同，因此结果可能偏离历史样本。",
            deja_judge: "判定：",
            deja_judge_text: "请将本系统视为研究工具，而非收益承诺工具。",

            res_title: "多周期共振 (Resonance)",
            res_def: "定义：",
            res_def_text: "当 1H、5M、1M 三个周期方向一致时，称为“共振增强”；方向分歧时，称为“共振减弱”。",
            res_principle: "原理：",
            res_principle_text: "共振增强通常意味着趋势更连贯；共振减弱通常意味着波动和反复增多。该逻辑是本平台预测算法的核心。",
            res_strat: "策略：",
            res_strat_text: "共振增强时可提高关注度；共振减弱时优先控制风险、降低仓位或等待确认。",

            ent_title: "风险与责任提示",
            ent_def: "定义：",
            ent_def_text: "本系统信息仅供参考，不构成任何形式的投资建议、收益承诺或交易保证。",
            ent_principle: "原理：",
            ent_principle_text: "用户应基于自身风险承受能力独立决策，并对全部交易行为及结果承担责任。",
            ent_alert: "警报：",
            ent_alert_text: "极端行情下信号可能失效，请勿将单一指标作为唯一下单依据。",

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
                "我们不对基于本服务做出的任何投资决策负责",
                "本服务不向中华人民共和国大陆地区居民提供，中国大陆用户访问须自行了解并遵守当地法律法规",
                "AI 确信度仅反映模型对历史模式的匹配程度，不等同于未来涨跌概率，请勿据此单独作出交易决策",
                "市场数据可能存在延迟、错误或中断，波动率信号计算基于特定参数，在极端行情下可能失效",
                "示例：极端行情、流动性危机或黑天鹅事件下，本平台信号可能出现较大偏差，建议结合多方信息综合判断"
            ]
        },
        en: {
            title: "Observer Protocol Guide",

            wave_title: "Core Engine: Multi-Timeframe Resonance",
            wave_def: "Definition:",
            wave_def_text: "The system observes 1H (macro trend), 5M (structure), and 1M (short-term movement) at the same time.",
            wave_principle: "Principle:",
            wave_principle_text: "The more aligned these timeframes are, the more stable the signal tends to be. The more they diverge, the noisier the signal becomes.",
            wave_conf: "Usage Note:",
            wave_conf_text: "Use resonance signals as decision support only, together with position sizing, stop-loss rules, and independent confirmation.",

            tactical_title: "Signal Interpretation (Simplified)",
            tactical_def: "Definition:",
            tactical_def_text: "Signals are references generated from historical-pattern matching, not guaranteed future outcomes.",
            tactical_fbg: "Bullish Signal:",
            tactical_fbg_text: "Means similar historical setups often moved up, but does not guarantee a future rise.",
            tactical_br: "Bearish Signal:",
            tactical_br_text: "Means similar historical setups often moved down, but does not guarantee a future drop.",
            tactical_auto: "Auto-Cruise:",
            tactical_auto_text: "Signals refresh periodically. During fast markets, always prioritize real-time exchange data.",

            deja_title: "Model Boundary",
            deja_def: "Definition:",
            deja_def_text: "AI outputs are based on historical data and parameterized calculations, not deterministic forecasts.",
            deja_principle: "Principle:",
            deja_principle_text: "Patterns may repeat, but context can change due to liquidity, macro events, and news shocks.",
            deja_judge: "Verdict:",
            deja_judge_text: "Treat this system as a research aid, not a promise of returns.",

            res_title: "Resonance",
            res_def: "Definition:",
            res_def_text: "When 1H, 5M, and 1M point in the same direction, resonance is stronger; when they conflict, resonance is weaker.",
            res_principle: "Principle:",
            res_principle_text: "Stronger resonance usually means more coherent trend behavior. This is the core logic of our prediction algorithm.",
            res_strat: "Strategy:",
            res_strat_text: "Increase attention when resonance is strong. Reduce risk or wait for confirmation when resonance is weak.",

            ent_title: "Risk & Responsibility",
            ent_def: "Definition:",
            ent_def_text: "Platform content is for informational purposes only and does not constitute investment advice or guaranteed returns.",
            ent_principle: "Principle:",
            ent_principle_text: "Users must make independent decisions based on their own risk tolerance and bear all trading consequences.",
            ent_alert: "Alert:",
            ent_alert_text: "In extreme markets, model signals can degrade. Never place trades based on a single indicator alone.",

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
                "We are not responsible for any investment decisions made based on this service",
                "This service is not offered to residents of mainland China. Users from mainland China must independently understand and comply with applicable local laws and regulations",
                "AI confidence reflects historical pattern fit only. It is not equivalent to future up/down probability and must not be used as a sole trading basis",
                "Market data may be delayed, inaccurate, or interrupted. Volatility signal calculations depend on specific parameters and may fail in extreme conditions",
                "Example: During extreme volatility, liquidity crises, or black swan events, platform signals may deviate significantly. Always cross-check with multiple information sources"
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
