import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { Newspaper, Gift, TrendingUp, Link as LinkIcon, Zap, X } from 'lucide-react';

export const DailyBriefContent = ({ lang = 'zh', onClose, isModal = false }) => {
    const [fngData, setFngData] = useState(null);
    const [newsData, setNewsData] = useState([]);
    const [kolData, setKolData] = useState({});
    const [loading, setLoading] = useState(true);

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const NEWS_CATEGORY_ID = 'breaking_news';

    // KOL账号配置 - 用于显示头像
    const KOL_ACCOUNTS = {
        zh: {
            airdrop: ["0xSunNFT", "ai_9684xtpa", "EmberCN", "YSI_crypto", "Bitwux", "hexiecs", "BTCwukong", "BensonTWN", "Jackyi_ld", "Guilin_Chen_"],
            kol: ["jason_chen998", "Loki_Zeng", "BTCdayu", "web3annie", "Guilin_Chen_", "Dp520888", "UnicornBitcoin", "roger9949", "shu8126"],
            signals: ["Phyrex_Ni", "TechFlowPost", "wublockchain12", "RonanFury", "laofeiyyds"]
        },
        en: {
            airdrop: ["DeFiIgnas", "milesdeutscher", "LarkDavis", "AltcoinDaily", "JamesWynnReal", "Mrcryptoxwhale", "TedPillows"],
            kol: ["VitalikButerin", "cz_binance", "brian_armstrong", "ErikVoorhees", "SebastienGllmt", "hosseeb"],
            signals: ["ITC_Crypto", "100trillionUSD", "CryptoHayes", "saylor", "APompliano"]
        }
    };

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
                    id: NEWS_CATEGORY_ID,
                    title: '突发新闻',
                    icon: Newspaper,
                    color: 'text-red-500',
                    border: 'border-red-500/20',
                    bg: 'bg-red-500/5',
                    items: [] // Will be populated from state
                },
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
                    id: NEWS_CATEGORY_ID,
                    title: 'Breaking News',
                    icon: Newspaper,
                    color: 'text-red-500',
                    border: 'border-red-500/20',
                    bg: 'bg-red-500/5',
                    items: []
                },
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

    // Defined via useCallback to be accessible by refresh handler
    const fetchBriefs = async () => {
        setLoading(true);
        const currentLang = safeLang;

        try {
            // UI to DB ID Mapping
            const categoryMap = {
                'airdrop': 'airdrop_hunters',
                'signals': 'traders',
                'kol': 'treasure_hunters'
            };

            const dbResults = {};

            // 1. Fetch FnG + DB Briefs + News (CryptoPanic) in Parallel
            const [fngResp, newsResp, ...briefResps] = await Promise.all([
                // FnG
                fetch('https://api.alternative.me/fng/?limit=1').then(r => r.json()).catch(() => null),

                // CryptoPanic via Edge Function
                supabase.functions.invoke(`cryptopanic-proxy?lang=${currentLang}`, {
                    method: 'GET'
                }).then(({ data }) => data).catch(err => {
                    console.error("CryptoPanic Fetch Error:", err);
                    return null;
                }),

                // DB Queries
                ...Object.keys(categoryMap).map(async (uiId) => {
                    const dbCategory = categoryMap[uiId];
                    const { data } = await supabase
                        .from('daily_briefs')
                        .select('content')
                        .eq('category', dbCategory)
                        .eq('lang', currentLang)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    return { uiId, content: data?.content || [] };
                })
            ]);

            // 2. Set FnG
            if (fngResp && fngResp.data && fngResp.data.length > 0) {
                setFngData(fngResp.data[0]);
            }

            // 3. Set News (CryptoPanic)
            if (newsResp && newsResp.results) {
                const mappedNews = newsResp.results.slice(0, 5).map(item => ({
                    text: item.title,
                    source: item.source?.title || item.domain || 'CryptoPanic',
                    link: item.url,
                    published_at: item.published_at
                }));
                setNewsData(mappedNews);
            }

            // 4. Set Briefs
            briefResps.forEach(({ uiId, content }) => {
                dbResults[uiId] = content;
            });
            setKolData(dbResults);

        } catch (e) {
            console.error("Failed to fetch brief data", e);
        } finally {
            setLoading(false);
        }
    };

    // Fetch All Data on Mount/Lang Change
    useEffect(() => {
        fetchBriefs();

        // Realtime Subscription (with error handling)
        try {
            const channel = supabase
                .channel('public:daily_briefs')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'daily_briefs' }, (payload) => {
                    console.log('New brief available, refreshing...', payload);
                    fetchBriefs();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } catch (error) {
            console.warn('Failed to setup realtime subscription:', error);
            return () => { };
        }
    }, [safeLang]);

    const fngValue = fngData ? parseInt(fngData.value) : 72;
    const fngClass = fngData ? fngData.value_classification : "Greed";

    // Determine color based on Fear/Greed
    const getFngColor = (val) => {
        if (val >= 75) return 'text-green-500';
        if (val >= 50) return 'text-green-400';
        if (val >= 25) return 'text-orange-400';
        return 'text-red-500';
    }

    const [selectedItem, setSelectedItem] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const handleForceRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            // Trigger fetch for each category to refresh DB
            const results = await Promise.all(Object.values(CATEGORIES).map(async (cat) => {
                const { data, error } = await supabase.functions.invoke('kol-proxy', {
                    body: { category: cat, lang: safeLang }
                });
                return { cat, data, error };
            }));

            // Aggregate Logs & Stats
            let allLogs = [];
            let failures = [];
            let totalNewItems = 0;

            results.forEach(r => {
                if (r.error || (r.data && r.data.error)) {
                    failures.push(`${r.cat}: ${r.error ? r.error.message : r.data.error}`);
                } else {
                    totalNewItems += (r.data.dataLength || 0);
                }

                if (r.data && r.data.logs) {
                    allLogs.push(`--- ${r.cat.toUpperCase()} ---`);
                    allLogs.push(...r.data.logs);
                }
            });

            // Trigger CryptoPanic refresh too
            await supabase.functions.invoke(`cryptopanic-proxy?lang=${safeLang}`);

            // Force pure frontend re-fetch immediately
            await fetchBriefs();

            if (failures.length > 0) {
                console.warn(`REFRESH COMPLETED WITH ERRORS! New Items Saved: ${totalNewItems}`, failures);
            } else {
                if (totalNewItems === 0) {
                    console.warn('REFRESHED BUT FOUND NO NEW DATA. RSSHub might be empty or blocked.');
                } else {
                    console.log(`✅ SUCCESS! Refreshed and Saved ${totalNewItems} New Items.`);
                }
            }
        } catch (e) {
            console.error("Refresh failed", e);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className={`bg-[#0a0a0c] border border-slate-800 w-full rounded-xl shadow-2xl relative overflow-hidden flex flex-col ${isModal ? 'max-w-5xl max-h-[90vh]' : 'h-full border-none shadow-none bg-transparent'}`}>

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

                {/* DEBUG REFRESH BUTTON */}
                <button
                    onClick={handleForceRefresh}
                    disabled={refreshing}
                    className="absolute top-4 right-16 px-3 py-1 bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 border border-slate-700 rounded-full transition-colors font-mono z-50"
                >
                    {refreshing ? (safeLang === 'zh' ? '正在刷新...' : 'REFRESHING...') : (safeLang === 'zh' ? '强制刷新源' : 'FORCE REFRESH')}
                </button>
            </div>

            {/* Official X Account Banner */}
            <div className="mb-6 px-4">
                <a
                    href={`https://x.com/${safeLang === 'zh' ? 'GoldCatNews' : 'GoldCatTerminal'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl px-5 py-3 hover:border-amber-500/40 hover:from-amber-500/20 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <img
                            src={`/assets/avatars/${safeLang === 'zh' ? 'GoldCatNews' : 'GoldCatTerminal'}.png`}
                            alt="Official"
                            className="w-10 h-10 rounded-full border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://ui-avatars.com/api/?name=GC&background=f59e0b&color=000&length=2';
                            }}
                        />
                        <div>
                            <div className="text-amber-400 font-bold text-sm flex items-center gap-1">
                                @{safeLang === 'zh' ? 'GoldCatNews' : 'GoldCatTerminal'}
                                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                </svg>
                            </div>
                            <div className="text-slate-400 text-xs">
                                {safeLang === 'zh' ? '关注官方账号获取最新情报' : 'Follow for latest alpha & updates'}
                            </div>
                        </div>
                    </div>
                    <div className="text-amber-500 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        {safeLang === 'zh' ? '关注 →' : 'Follow →'}
                    </div>
                </a>
            </div>

            {isModal && onClose && (
                <div className="absolute top-4 right-4 z-10">
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Grid Content */}
            <div className={`p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 ${isModal ? 'overflow-y-auto custom-scrollbar' : ''}`}>
                {currentMock.cards.map((card) => {
                    // STRICT REAL DATA POLICY: No fallback to card.items
                    let items = [];
                    if (card.id === NEWS_CATEGORY_ID) {
                        items = newsData || [];
                    } else {
                        items = kolData[card.id] || [];
                    }

                    const hasData = items.length > 0;

                    return (
                        <div key={card.id} className={`p-6 rounded-lg border ${card.border} ${card.bg} group relative overflow-hidden transition-all hover:bg-opacity-10`}>
                            <div className="flex items-center gap-3 mb-4">
                                <card.icon className={`w-5 h-5 ${card.color}`} />
                                <h3 className="text-lg font-bold text-white">{card.title}</h3>
                                {loading ? (
                                    <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-1 rounded animate-pulse border border-yellow-500/20">LOADING...</span>
                                ) : hasData ? (
                                    <span className="text-[10px] text-green-500 bg-green-500/10 px-1 rounded border border-green-500/20">LIVE FEED</span>
                                ) : (
                                    <span className="text-[10px] text-red-500 bg-red-500/10 px-1 rounded border border-red-500/20">NO DATA</span>
                                )}
                            </div>
                            <ul className="space-y-4">
                                {loading ? (
                                    // Loading Skeleton
                                    <>
                                        <li className="h-16 bg-slate-800/50 rounded w-full animate-pulse"></li>
                                        <li className="h-16 bg-slate-800/50 rounded w-3/4 animate-pulse"></li>
                                    </>
                                ) : hasData ? (
                                    items.slice(0, 8).map((item, idx) => {
                                        const text = item.text;
                                        const source = item.source;
                                        // Simple heuristic for source URL if not provided
                                        // If source doesn't contain http, assume twitter handle
                                        const sourceUrl = item.link || (source && !source.includes('http') ? `https://x.com/${source}` : source);

                                        return (
                                            <li key={idx}
                                                onClick={() => setSelectedItem({ ...item, sourceUrl, cardColor: card.color, cardTitle: card.title })}
                                                className="flex gap-3 text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors break-words items-start cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded"
                                            >
                                                <span className={`mt-1.5 w-1 h-1 rounded-full ${card.color} shrink-0`}></span>
                                                <div className="flex-1">
                                                    <p className="line-clamp-4 mb-1">{text}</p>
                                                    {source && (
                                                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 opacity-70">
                                                            Source: <span className="text-slate-400">@{source}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })
                                ) : (
                                    // No Data State
                                    <li className="flex flex-col items-center justify-center p-4 text-center opacity-50">
                                        <p className="text-xs text-slate-500">
                                            {safeLang === 'zh' ? '暂无实时数据' : 'No Live Data Available'}
                                        </p>
                                        <p className="text-[10px] text-slate-600">Source Offline</p>
                                    </li>
                                )}
                            </ul>

                            {/* KOL Avatar Row - 显示关注的KOL头像 */}
                            {card.id !== NEWS_CATEGORY_ID && KOL_ACCOUNTS[safeLang]?.[card.id] && (
                                <div className="mt-4 pt-3 border-t border-white/5">
                                    <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">
                                        {safeLang === 'zh' ? '关注中' : 'Following'}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {KOL_ACCOUNTS[safeLang][card.id].map((handle, idx) => (
                                            <a
                                                key={idx}
                                                href={`https://x.com/${handle}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group/avatar relative"
                                                title={`@${handle}`}
                                            >
                                                <img
                                                    src={`/assets/avatars/${handle}.png`}
                                                    alt={handle}
                                                    className="w-7 h-7 rounded-full border border-white/10 hover:border-white/40 transition-all hover:scale-110 bg-slate-800"
                                                    onError={(e) => {
                                                        e.target.onerror = null; // Prevent infinite loop
                                                        e.target.src = `https://ui-avatars.com/api/?name=${handle}&background=1a1a1a&color=888&font-size=0.5&length=2`;
                                                    }}
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Decorative Flash */}
                            <div className={`absolute -right-10 -bottom-10 w-32 h-32 ${card.color} opacity-5 blur-3xl rounded-full group-hover:opacity-10 transition-opacity`}></div>
                        </div>
                    );
                })}
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(234,179,8,0.3)]"></div>
                    <h3 className="text-xl font-bold text-white mb-2 animate-pulse">
                        {safeLang === 'zh' ? '正在同步全球情报...' : 'Syncing Global Intel...'}
                    </h3>
                    <p className="text-slate-400 text-sm max-w-md">
                        {safeLang === 'zh' ? '连接至去中心化节点网络...' : 'Connecting to decentralized node network...'}
                    </p>
                    <div className="mt-8 text-[10px] text-slate-600 font-mono border border-slate-800 px-3 py-1 rounded-full bg-black/50">
                        {safeLang === 'zh' ? '预计时间: 2-5 秒' : 'ESTIMATED_TIME: 2-5 SECONDS'}
                    </div>
                </div>
            )}

            {/* DETAIL MODAL */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
                    <div className="bg-[#0f0f11] border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`text-xs font-mono px-2 py-1 rounded bg-white/5 border border-white/10 ${selectedItem.cardColor}`}>
                                    {selectedItem.cardTitle}
                                </div>
                                <button onClick={() => setSelectedItem(null)} className="text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-lg text-slate-200 leading-relaxed mb-6 whitespace-pre-wrap">
                                {selectedItem.text}
                            </p>

                            <div className="flex justify-between items-center border-t border-slate-800 pt-4">
                                <div className="text-xs text-slate-500 font-mono">
                                    Source: @{selectedItem.source}
                                </div>
                                {selectedItem.sourceUrl && selectedItem.cardTitle !== '突发新闻' && selectedItem.cardTitle !== 'Breaking News' && (
                                    <a href={selectedItem.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                        {safeLang === 'zh' ? '查看原文' : 'View Original'} <LinkIcon className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 border-t border-slate-800/50 flex justify-between items-center text-[10px] text-slate-600 font-mono">
                <span>POWERED_BY_GOLDCAT_AI_CORE</span>
                <span>SOURCE: ALTERNATIVE.ME / RSSHUB | v3.1.0 (UNIFIED)</span>
            </div>
        </div>
    );
};
