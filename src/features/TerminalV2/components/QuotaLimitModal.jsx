import React from 'react';
import { X, Zap, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const QuotaLimitModal = ({ isOpen, onClose, onUpgrade, isPremium, lang }) => {

    const content = isPremium ? {
        title: lang === 'en' ? 'Daily Limit Reached' : '今日观测上限',
        desc: lang === 'en' ? 'You have used all 30 quantum observations for today. Please come back tomorrow for renewed energy.' : '您已使用完今日的 30 次量子观测机会。请明日等待能量重置后再来。',
        icon: <Zap className="w-8 h-8 text-yellow-500" />,
        buttonText: lang === 'en' ? 'Close' : '关闭',
        action: onClose
    } : {
        title: lang === 'en' ? 'Free Limit Reached' : '免费额度已耗尽',
        desc: lang === 'en' ? 'You have used your 2 free observations. Upgrade to PRO to unlock 30 daily observations and AI deep analysis.' : '您已使用完 2 次免费观测机会。升级为 PRO 会员即可解锁每日 30 次观测及 AI 深度分析权限。',
        icon: <Lock className="w-8 h-8 text-yellow-500" />,
        buttonText: lang === 'en' ? 'Upgrade to PRO' : '立即升级 PRO',
        action: onUpgrade
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-[#0f1115] border border-yellow-500/30 rounded-lg shadow-[0_0_30px_rgba(234,179,8,0.1)] w-full max-w-sm overflow-hidden"
                    >
                        {/* Header Decoration */}
                        <div className="h-1 w-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />

                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8 flex flex-col items-center text-center space-y-5">
                            <div className="p-4 bg-yellow-500/10 rounded-full ring-1 ring-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                                {content.icon}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white font-sans tracking-wide">
                                    {content.title}
                                </h3>

                                <p className="text-sm text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                                    {content.desc}
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    content.action();
                                    // ensure modal closes if action is upgrade (usually it switches tab, but good to clean up)
                                    onClose();
                                }}
                                className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold rounded shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {content.action === onUpgrade && <Zap className="w-4 h-4 fill-current" />}
                                {content.buttonText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
