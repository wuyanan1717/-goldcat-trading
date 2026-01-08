import React, { useEffect, useState } from 'react';
import { X, Newspaper, Gift, TrendingUp, Link as LinkIcon, Zap, Globe, MessageSquare } from 'lucide-react';
import { translations } from '../../../translations';

export const DailyBriefModal = ({ isOpen, onClose, lang = 'zh' }) => {
    if (!isOpen) return null;

    const [fngData, setFngData] = useState(null);
    const [kolData, setKolData] = useState({});
    const [loading, setLoading] = useState(true);

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

    // Categories mapping
    const CATEGORIES = {
        airdrop: 'airdrop_hunters',
        signals: 'traders',
        kol: 'treasure_hunters'
    };

    // Explicit Bilingual Data Structure
    const DATA_MOCK = {
        zh: {
            date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
            sentiment: {
                summary: "随着 ETH/SOL 生态系统的轮动，BTC 主导地位略有下降，市场正在升温。情绪表明市场在期待“山寨季”。"
            },
            cards: [
                {
                    id: 'airdrop',
                    title: '空投 Alpha',
                    icon: Gift,
                    color: 'text-purple-400',
                    border: 'border-purple-500/20',
                    bg: 'bg-purple-500/5',
                    items: []
                },
                {
                    id: 'signals',
                    title: '交易信号',
                    icon: TrendingUp,
                    color: 'text-blue-400',
                    border: 'border-blue-500/20',
                    bg: 'bg-blue-500/5',
                    items: []
                },
                {
                    id: 'kol',
                    title: 'KOL 潜藏宝石',
                    icon: Zap,
                    color: 'text-yellow-400',
                    border: 'border-yellow-500/20',
                    bg: 'bg-yellow-500/5',
                    items: []
                }
            ]
        },
        en: {
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            sentiment: {
                summary: "Institutional accumulation detected on-chain. BTC dominance waning as capital rotates into high-beta L1s. Sentiment leans bullish."
            },
            cards: [
                {
                    id: 'airdrop',
                    title: 'Airdrop Alpha',
                    icon: Gift,
                    color: 'text-purple-400',
                    border: 'border-purple-500/20',
                    bg: 'bg-purple-500/5',
                    items: []
                },
                {
                    id: 'signals',
                    title: 'Trading Signals',
                    icon: TrendingUp,
                    color: 'text-blue-400',
                    border: 'border-blue-500/20',
                    bg: 'bg-blue-500/5',
                    items: []
                },
                {
                    id: 'kol',
                    title: 'KOL Hidden Gems',
                    icon: Zap,
                    color: 'text-yellow-400',
                    border: 'border-yellow-500/20',
                    bg: 'bg-yellow-500/5',
                    items: []
                }
            ]
        }
    };

    // Helper to safely get current language data
    const safeLang = (lang === 'zh' || lang === 'en') ? lang : 'zh';
    const currentMock = DATA_MOCK[safeLang];

    // Fetch All Data
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            // Reset KOL data when switching languages so we don't show stale mixed content
            setKolData({});

            try {
                // 1. Fetch Fear & Greed
                const fngRes = await fetch('https://api.alternative.me/fng/?limit=1');
                const fngJson = await fngRes.json();
                if (fngJson.data && fngJson.data.length > 0) {
                    setFngData(fngJson.data[0]);
                }

                // 2. Fetch KOL Data (Parallel)
                const promises = Object.entries(CATEGORIES).map(async ([cardId, backendCategory]) => {
                    try {
                        const url = `${SUPABASE_URL}/functions/v1/kol-proxy`;
                        const res = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ category: backendCategory, lang: safeLang })
                        });

                        if (!res.ok) throw new Error('Proxy Failed');

                        const json = await res.json();
                        // Transform to structure
                        const items = json.data.slice(0, 10).map(tweet => {
                            // Basic cleanup
                            let text = tweet.content.length > 200 ? tweet.content.substring(0, 200) + "..." : tweet.content;
                            // Remove URLs for cleaner UI
                            text = text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
                            return {
                                text: text,
                                source: tweet.author
                            };
                        });

                        return { id: cardId, items };

                    } catch (e) {
                        console.warn(`Failed fetch for ${cardId}`, e);
                        return null;
                    }
                });

                const results = await Promise.all(promises);
                const newKolData = {};
                results.forEach(res => {
                    if (res) newKolData[res.id] = res.items;
                });
                setKolData(newKolData);

            } catch (e) {
                console.error("Failed to fetch brief data", e);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchAllData();
        }
    }, [isOpen, safeLang]); // Re-fetch when lang changes

    const fngValue = fngData ? parseInt(fngData.value) : 72;
    const fngClass = fngData ? fngData.value_classification : "Greed";

    // Determine color based on Fear/Greed
    const getFngColor = (val) => {
        if (val >= 75) return 'text-green-500';
        if (val >= 50) return 'text-green-400';
        if (val >= 25) return 'text-orange-400';
        return 'text-red-500';
    }

    // Note: mockBrief.cards is already conditional in the previous implementation, 
    // but here we need to merge it with real data.

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#0a0a0c] border border-slate-800 w-full max-w-5xl rounded-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header Section */}
                <div className="p-6 md:p-8 pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase">
                                {safeLang === 'zh' ? '加密情报聚合器' : 'Crypto Daily Brief'}
                            </span>
                            <span className="text-slate-500 text-xs font-mono">{currentMock.date}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                            {safeLang === 'zh' ? '市场情绪' : 'Market Sentiment'}
                        </h2>
                        <p className="text-slate-400 mt-2 max-w-2xl leading-relaxed">
                            {currentMock.sentiment.summary}
                        </p>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className={`text-6xl font-bold tracking-tighter ${getFngColor(fngValue)}`}>
                            {loading ? <span className="animate-pulse">--</span> : fngValue}
                        </div>
                        <div className="text-slate-500 text-xs font-mono tracking-widest uppercase mt-1">
                            {safeLang === 'zh' ? '恐慌指数' : 'Fear & Greed'}: <span className={getFngColor(fngValue)}>{loading ? "..." : fngClass}</span>
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 right-4">
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Grid Content */}
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar">
                    {currentMock.cards.map((card) => {
                        // STRICT REAL DATA POLICY: No fallback to card.items
                        const items = kolData[card.id] || [];

                        return (
                            <div key={card.id} className={`p-6 rounded-lg border ${card.border} ${card.bg} group relative overflow-hidden transition-all hover:bg-opacity-10`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <card.icon className={`w-5 h-5 ${card.color}`} />
                                    <h3 className="text-lg font-bold text-white">{card.title}</h3>
                                    {kolData[card.id] ?
                                        <span className="text-[10px] text-green-500 bg-green-500/10 px-1 rounded animate-pulse border border-green-500/20">LIVE FEED</span> :
                                        <span className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded border border-slate-700">MOCK</span>
                                    }
                                </div>
                                <ul className="space-y-4">
                                    {loading && !kolData[card.id] ? (
                                        // Loading Skeleton
                                        <>
                                            <li className="h-16 bg-slate-800/50 rounded w-full animate-pulse"></li>
                                            <li className="h-16 bg-slate-800/50 rounded w-3/4 animate-pulse"></li>
                                        </>
                                    ) : (
                                        items.map((item, idx) => {
                                            // Handle both string (legacy mock) and object (new structure)
                                            const text = typeof item === 'string' ? item : item.text;
                                            const source = typeof item === 'string' ? 'System' : item.source;

                                            return (
                                                <li key={idx} className="flex gap-3 text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors break-words items-start">
                                                    <span className={`mt-1.5 w-1 h-1 rounded-full ${card.color} shrink-0`}></span>
                                                    <div className="flex-1">
                                                        <p className="line-clamp-3 mb-1">{text}</p>
                                                        {source && (
                                                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 opacity-70">
                                                                Source: <span className="text-slate-400">@{source}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })
                                    )}
                                </ul>

                                {/* Decorative Flash */}
                                <div className={`absolute -right-10 -bottom-10 w-32 h-32 ${card.color} opacity-5 blur-3xl rounded-full group-hover:opacity-10 transition-opacity`}></div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-slate-800 bg-black/20 flex justify-between items-center text-[10px] text-slate-600 font-mono">
                    <span>POWERED_BY_GOLDCAT_AI_CORE</span>
                    <span>SOURCE: ALTERNATIVE.ME / RSSHUB | v2.2.0 (FIXED)</span>
                </div>
            </div>
        </div>
    );
};
