import React, { useState, useMemo, useEffect } from 'react';
import ReactGA from 'react-ga4';
import { supabase } from './supabaseClient';
import { getCheckoutUrl, CREEM_CONFIG } from './creemConfig';
import PrivacyPolicyPage from './PrivacyPolicyPage';
import TermsOfServicePage from './TermsOfServicePage';
// Removed ParticleLogo and BackgroundParticles to reduce bundle size
import DailyAlphaTab from './components/DailyAlphaTab';
import {
    TrendingUp, TrendingDown, DollarSign, Package, AlertCircle, BarChart3, Target,
    Award, Plus, X, Crown, Calendar, CreditCard, Wallet, User, LogOut, Trash2,
    Infinity, Activity, Zap, FileText, Brain, Sparkles, CheckCircle2, AlertTriangle,
    Lightbulb, Shield, Globe, MessageSquare, Cpu, ChevronRight, ChevronDown, Lock, Unlock, Settings,
    PieChart, BarChart, ArrowRight, Compass, Edit3, ShieldCheck, Coins, Copy,
    PlusCircle, Check, RotateCcw, Info, Loader2, Trophy, Clock, Snowflake, BarChart2,
    Send, Star, Gift, Newspaper, Terminal, Search, Radar, Eye, BookOpen, Upload, Image as ImageIcon
} from 'lucide-react';
import { translations } from './translations';
// Version-aware imports for Quantum Observer - Direct import (no lazy) for instant loading
import TerminalAppV3 from './features/TerminalV2/TerminalApp_v3';
import TerminalAppV4 from './features/TerminalV2/TerminalApp_v4';
import TerminalAppV5 from './features/TerminalV2/TerminalApp_v5';
// Keep AIAnalysisDashboard lazy since it's heavy and not frequently accessed
import { lazy, Suspense } from 'react';
const AIAnalysisDashboard = lazy(() => import('./components/AIAnalysisDashboard'));

import { getFeatureVersion } from './config/versionConfig';
import { MobileDebugOverlay } from './features/TerminalV2/components/MobileDebugOverlay';
import TradeEntryForm from './features/Trading/TradeEntryForm';



// Data Sync Status Indicator Component (Icon Only)
const SyncStatusIndicator = ({ status }) => {
    const statusConfig = {
        synced: { icon: CheckCircle2, color: 'text-green-500' },
        saving: { icon: Loader2, color: 'text-amber-500', animate: 'animate-spin' },
        error: { icon: AlertTriangle, color: 'text-red-500' }
    };

    const config = statusConfig[status] || statusConfig.synced;
    const Icon = config.icon;

    return (
        <div className={`flex items-center justify-center w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 ${config.color} transition-all duration-300`} title={status === 'synced' ? '已同步 / Saved' : status}>
            <Icon className={`w-4 h-4 ${config.animate || ''}`} />
        </div>
    );
};
// --- Fortune Data ---
const HEXAGRAMS = [
    { symbol: '䷀', name: { zh: '乾为天', en: 'The Creative' }, meaning: { zh: '飞龙在天，利见大人。趋势确立，顺势而为。', en: 'Flying Dragon in the Heavens. Strong trend, follow it.' }, type: 'bullish' },
    { symbol: '䷁', name: { zh: '坤为地', en: 'The Receptive' }, meaning: { zh: '厚德载物，顺势而行。耐心等待，切勿急躁。', en: 'Great virtue holds all things. Be patient, do not rush.' }, type: 'neutral' },
    { symbol: '䷂', name: { zh: '水雷屯', en: 'Difficulty at the Beginning' }, meaning: { zh: '万事开头难。市场混沌，建议轻仓试探。', en: 'Chaos at the start. Test waters with small size.' }, type: 'bearish' },
    { symbol: '䷄', name: { zh: '水天需', en: 'Waiting' }, meaning: { zh: '需于沙。时机未到，耐心等待突破。', en: 'Waiting in the sand. Wait for the breakout.' }, type: 'neutral' },
    { symbol: '䷆', name: { zh: '地水师', en: 'The Army' }, meaning: { zh: '师出有名。制定计划，严格执行纪律。', en: 'The Army needs discipline. Stick to your plan.' }, type: 'neutral' },
    { symbol: '䷊', name: { zh: '地天泰', en: 'Peace' }, meaning: { zh: '三阳开泰。多头排列，获利丰厚。', en: 'Peace and prosperity. Bullish alignment, good profits.' }, type: 'bullish' },
    { symbol: '䷋', name: { zh: '天地否', en: 'Standstill' }, meaning: { zh: '否之匪人。行情背离，注意风险，及时止损。', en: 'Standstill. Divergence warning, manage risk.' }, type: 'bearish' },
    { symbol: '䷍', name: { zh: '火天大有', en: 'Possession in Great Measure' }, meaning: { zh: '火在天上。收获季节，注意落袋为安。', en: 'Fire in heaven. Harvest time, take profits.' }, type: 'bullish' },
    { symbol: '䷒', name: { zh: '地泽临', en: 'Approach' }, meaning: { zh: '至于八月有凶。短期看涨，警惕反转。', en: 'Approach. Short term bullish, watch for reversal.' }, type: 'bullish' },
    { symbol: '䷗', name: { zh: '地雷复', en: 'Return' }, meaning: { zh: '反复其道。触底反弹，关注反转信号。', en: 'Return. Bottom bounce, watch for reversal signals.' }, type: 'bullish' },
    { symbol: '䷝', name: { zh: '离为火', en: 'The Clinging' }, meaning: { zh: '日丽中天。波动加剧，快进快出。', en: 'Fire. High volatility, scalp quickly.' }, type: 'neutral' },
    { symbol: '䷜', name: { zh: '坎为水', en: 'The Abysmal' }, meaning: { zh: '水流而不盈。险象环生，空仓观望为宜。', en: 'Water flows but does not fill. Dangerous, stay out.' }, type: 'bearish' }
];

const ALMANAC_ITEMS = {
    suit: [
        { zh: '做多', en: 'Long' }, { zh: '做空', en: 'Short' }, { zh: '持仓', en: 'Hold' },
        { zh: '复盘', en: 'Review' }, { zh: '止盈', en: 'Take Profit' }, { zh: '学习', en: 'Study' }
    ],
    avoid: [
        { zh: '追涨', en: 'FOMO Buy' }, { zh: '杀跌', en: 'Panic Sell' }, { zh: '高倍杠杆', en: 'High Lev' },
        { zh: '频繁交易', en: 'Overtrade' }, { zh: '逆势', en: 'Counter Trend' }, { zh: '扛单', en: 'No Stop Loss' }
    ]
};

const getDailyFortune = (dateStr, birthDate = '') => {
    // Simple pseudo-random seeded by date string AND birthDate if available
    let hash = 0;
    const seedStr = dateStr + birthDate;
    for (let i = 0; i < seedStr.length; i++) {
        hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    const seed = Math.abs(hash);

    const hexagram = HEXAGRAMS[seed % HEXAGRAMS.length];
    const suitIndex = seed % ALMANAC_ITEMS.suit.length;
    const avoidIndex = (seed + 1) % ALMANAC_ITEMS.avoid.length;
    const directionKeys = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
    const colorKeys = ['red', 'green', 'black', 'white', 'yellow'];

    return {
        hexagram,
        suit: ALMANAC_ITEMS.suit[suitIndex],
        avoid: ALMANAC_ITEMS.avoid[avoidIndex],
        direction: directionKeys[seed % directionKeys.length],
        color: colorKeys[seed % colorKeys.length]
    };
};


// --- 1. 模拟数据与常量 ---

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
const getInitialPatterns = (language) => {
    if (language === 'zh') {
        return [
            '回调', '趋势跟踪', '突破', '反转', '区间震荡',
            '头肩顶', '双顶', '回踩确认', '趋势线突破', '楔形'
        ];
    } else {
        return [
            'Pullback', 'Trend Following', 'Breakout', 'Reversal', 'Range Trading',
            'Head and Shoulders Top', 'Double Top', 'Pullback Confirmation', 'Trendline Break', 'Wedge'
        ];
    }
};

// 模拟 AI 市场数据（保留作为辅助）
const generateMarketData = () => {
    const data = [];
    let price = 66500;
    for (let i = 0; i < 20; i++) {
        price += (Math.random() - 0.5) * 500;
        data.push({ time: i, price });
    }
    return data;
};

// Custom Santa Icon Component
const SantaIcon = ({ className }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M17 7c-2-3-7-3-10 0-3 3 0 7 0 7l3 3h4l3-3s3-4 0-7z" fill="white" fillOpacity="0.15" />
        <path d="M7 14s-3-4 0-7c3-3 8-3 10 0 3 3 0 7 0 7" stroke="currentColor" />
        <circle cx="12" cy="3" r="1.5" fill="white" />
        <path d="M9 14c0 2 1 4 3 4s3-2 3-4" />
        <path d="M7 14h10" />
        <path d="M12 18c-3 0-5-2-5-5h10c0 3-2 5-5 5z" fill="white" fillOpacity="0.2" />
        <circle cx="10" cy="11" r="0.6" fill="currentColor" />
        <circle cx="14" cy="11" r="0.6" fill="currentColor" />
        <circle cx="12" cy="14" r="0.4" fill="#ef4444" stroke="none" />
    </svg>
);

const ChristmasBanner = ({ children, t }) => {
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        try {
            const el = document.createElement('textarea');
            el.value = 'D2MUNZAK';
            el.setAttribute('readonly', '');
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);

            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('无法复制内容: ', err);
        }
    };

    return (
        <div className="w-full py-24 my-16 bg-[#050505] text-zinc-100 font-sans selection:bg-red-500/30 overflow-hidden relative rounded-3xl border border-neutral-800">

            {/* 氛围背景：圣诞夜深红光晕 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[700px] bg-gradient-to-b from-red-800/25 via-red-900/5 to-transparent pointer-events-none" />

            {/* 动态飘雪效果 */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(40)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full blur-[1px] animate-snow"
                        style={{
                            top: '-10%',
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
                            opacity: Math.random() * 0.4 + 0.2,
                            animationDuration: `${Math.random() * 12 + 8}s`,
                            animationDelay: `${Math.random() * 10}s`
                        }}
                    />
                ))}
            </div>

            <div className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center justify-center">

                {/* 顶部节日 Header */}
                <div className="flex flex-col items-center mb-12 text-center">
                    <div className="relative mb-8">
                        <div className="absolute -inset-10 bg-red-600/40 blur-[50px] rounded-full animate-pulse" />

                        <div className="relative w-32 h-32 bg-gradient-to-br from-red-500 to-red-700 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.7)] border border-red-400/40 overflow-hidden group">
                            <SantaIcon className="text-white w-22 h-22 animate-santa-nod z-10 drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>

                        <Star className="absolute -top-4 -right-4 text-amber-400 w-10 h-10 fill-amber-400 animate-spin-slow drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent italic uppercase">
                        Merry Christmas
                    </h1>
                    <p className="text-red-500 font-black tracking-[0.4em] text-[10px] uppercase bg-red-500/10 px-6 py-1.5 rounded-full border border-red-500/20 backdrop-blur-sm">
                        {t('christmas.wish')}
                    </p>
                </div>

                {/* 核心圣诞横幅 */}
                <div className="w-full bg-zinc-900/60 border border-red-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl relative overflow-hidden group/banner shadow-2xl">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Snowflake size={120} className="rotate-12" />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-1 text-center md:text-left">
                            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{t('christmas.title')}</h2>
                            <p className="text-zinc-400 text-base max-w-sm">
                                {t('christmas.desc')}
                            </p>
                        </div>
                    </div>

                    {/* 折扣码区域 */}
                    <div className="flex flex-col items-center md:items-end gap-3">
                        <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                            <Gift size={14} /> {t('christmas.voucher')}
                        </span>
                        <div
                            onClick={copyCode}
                            className="relative cursor-pointer group/code active:scale-95 transition-all"
                        >
                            <div className="absolute -inset-2 bg-gradient-to-r from-red-600 to-amber-500 rounded-2xl blur opacity-40 group-hover/code:opacity-100 transition duration-500" />
                            <div className="relative flex items-center gap-6 px-8 py-4 bg-red-600 rounded-2xl border border-white/20 shadow-2xl">
                                <span className="font-mono text-3xl font-black text-white tracking-[0.2em] italic">D2MUNZAK</span>
                                <div className="w-px h-8 bg-white/20" />
                                <div className="flex flex-col items-center min-w-[50px]">
                                    {copied ? (
                                        <Check className="text-white animate-bounce" size={24} />
                                    ) : (
                                        <Copy className="text-white/80 group-hover/code:text-white" size={24} />
                                    )}
                                    <span className="text-[9px] font-black mt-1 uppercase text-white/70">
                                        {copied ? t('christmas.claimed') : t('christmas.click_claim')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 底部祝福语 */}
                {/* 底部祝福语 - Keep it, but render children (Pricing) before or after it? Let's render children BEFORE the footer blessing */}

                {children && <div className="mt-16 w-full">{children}</div>}

                <div className="mt-24 flex flex-col items-center gap-6 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex gap-4">
                        <Snowflake className="text-red-900/40" size={20} />
                        <Snowflake className="text-red-900/80" size={24} />
                        <Snowflake className="text-red-900/40" size={20} />
                    </div>
                    <p className="text-zinc-600 text-[10px] tracking-[0.5em] uppercase font-black text-center">
                        圣诞之夜 · 愿盈余与你常在
                    </p>
                </div>

            </div>

            {/* 动画关键帧 */}
        </div>
    );
};

const SnowfallOverlay = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
            {[...Array(50)].map((_, i) => (
                <div
                    key={i}
                    className="absolute bg-white rounded-full blur-[1px] animate-snow"
                    style={{
                        top: '-10%',
                        left: `${Math.random() * 100}%`,
                        width: `${Math.random() * 4 + 2}px`,
                        height: `${Math.random() * 4 + 2}px`,
                        opacity: Math.random() * 0.5 + 0.3,
                        animationDuration: `${Math.random() * 10 + 10}s`,
                        animationDelay: `${Math.random() * 5}s`
                    }}
                />
            ))}
        </div>
    );
};

function GoldCatApp() {
    const [showSuggestions, setShowSuggestions] = useState(false);

    // ===== VERSION CONTROL SYSTEM =====

    // ===== VERSION CONTROL SYSTEM =====
    // Dynamically select Quantum Observer version (V3 stable vs V4/V5 development)
    const quantumObserverVersion = getFeatureVersion('QUANTUM_OBSERVER', null);

    // Feature Flag Override: Allow ?v=v5 in URL for dev testing
    const urlParams = new URLSearchParams(window.location.search);
    const forceVersion = urlParams.get('v');
    const effectiveVersion = forceVersion || quantumObserverVersion;

    const TerminalApp = effectiveVersion === 'v5' ? TerminalAppV5 :
        (effectiveVersion === 'v3' ? TerminalAppV3 : TerminalAppV4);

    // Optional: Log version for debugging (remove in production)
    useEffect(() => {
        console.log(`🔮 Quantum Observer Version: ${quantumObserverVersion.toUpperCase()}`);
        console.log(`🚀 App Version: 39 (Auto-Login Fixed)`);
    }, [quantumObserverVersion]);
    // ===================================

    // Dynamic challenge count logic (Deterministic & Time-based)
    // 逻辑：基于固定锚点时间的纯数学计算，确保刷新、不同设备、长期挂机保持严格一致
    // 用户指定：起始数 340，固定增长逻辑
    const calculateChallengeCount = () => {
        // Anchor: 2025-12-25 00:00:00 Base: 340
        const anchorTime = new Date('2025-12-25T00:00:00').getTime();
        const baseCount = 340;
        const now = Date.now();

        // Rate: Composite frequency to create "organic" irregular growth
        // 算法：叠加两个不同周期的增长线 (0.4/h 和 0.15/h)
        // 效果：增长间隔不固定（有时快有时慢），但总体呈上升趋势，且严格一致
        const hoursPassed = Math.max(0, (now - anchorTime) / (1000 * 60 * 60));

        // Growth Component 1: Main steady stream (approx 1 per 2.5 hours)
        const g1 = Math.floor(hoursPassed * 0.4);

        // Growth Component 2: Occasional bursts (approx 1 per 7 hours)
        const g2 = Math.floor(hoursPassed * 0.15);

        // Growth Component 3: Micro-variations based on day of year (adds 0-2 fixed offset per day)
        const dayOffset = Math.floor(hoursPassed / 24) % 3;

        return baseCount + g1 + g2 + dayOffset;
    };

    const [challengeCount, setChallengeCount] = useState(calculateChallengeCount);

    useEffect(() => {
        // Sync every minute to update if natural growth happens
        const interval = setInterval(() => {
            setChallengeCount(calculateChallengeCount());
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);
    // --- 2. 状态管理 (带持久化) ---

    // 用户系统
    // 用户系统
    // Auth State Optimization: unknown -> authed/guest
    const [authState, setAuthState] = useState('unknown'); // 'unknown' | 'authed' | 'guest'
    const [user, setUser] = useState(null);
    const [membership, setMembership] = useState({ isPremium: false, expiryDate: null, maxTrades: 20 });
    const [riskMode, setRiskMode] = useState('balanced'); // Risk mode: defensive, balanced, aggressive, degen
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showGuestDashboard, setShowGuestDashboard] = useState(false);
    const [explicitLandingView, setExplicitLandingView] = useState(false); // Valid for logged-in users wanting to see homepage
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [pendingGuestTrade, setPendingGuestTrade] = useState(false); // Guest data persistence flag
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [editedUsername, setEditedUsername] = useState('');
    const [feedbackForm, setFeedbackForm] = useState({
        name: '',
        email: '',
        type: 'suggestion',
        content: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'saving' | 'error'
    const [currentPage, setCurrentPage] = useState('main'); // 'main' | 'privacy' | 'terms'
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    // 多语言支持
    const [language, setLanguage] = useState(() => {
        // 1. 优先使用用户手动选择的语言
        const saved = localStorage.getItem('goldcat_language');
        if (saved) return saved;

        // 2. 默认英语（适合国际用户）
        // IP 检测会在后台运行，中国用户会自动切换到中文
        return 'en';
    });

    // IP Detection (Non-blocking / Background)
    useEffect(() => {
        const saved = localStorage.getItem('goldcat_language');
        if (saved) return; // Respect user override

        // Fast & Cheap IP Check using Cloudflare Trace
        fetch('https://www.cloudflare.com/cdn-cgi/trace')
            .then(res => res.text())
            .then(data => {
                if (data.includes('loc=CN')) {
                    console.log('Detected China IP, switching to Chinese');
                    setLanguage('zh');
                }
            })
            .catch(err => {
                console.warn('IP Check Failed, staying in English', err);
            });
    }, []);

    // Initialize Google Analytics 4
    // GA4 Initialization Removed for China Performance
    useEffect(() => {
        console.log('GA4 Skipped for Performance');
    }, []);

    // 监听语言变化并保存
    useEffect(() => {
        localStorage.setItem('goldcat_language', language);
        const newPatterns = getInitialPatterns(language);
        setPatterns(newPatterns); // 更新 patterns

        // Dynamic Title Localization
        document.title = 'Goldcat Terminal';
    }, [language]);

    // Track page views: Landing vs Dashboard
    useEffect(() => {
        if (user && !explicitLandingView) {
            // User is on Dashboard (Trading Input Page)
            ReactGA.send({ hitType: "pageview", page: "/dashboard", title: "Dashboard - Trading Input" });
        } else if (!user && showGuestDashboard) {
            // Guest is viewing Dashboard
            ReactGA.send({ hitType: "pageview", page: "/guest-dashboard", title: "Guest Dashboard" });
        } else {
            // Landing page
            ReactGA.send({ hitType: "pageview", page: "/", title: "Landing Page" });
        }
    }, [user, explicitLandingView, showGuestDashboard]);

    // Track Login/Register modal opens
    useEffect(() => {
        if (showLoginModal) {
            const eventAction = isRegisterMode ? 'Open Register Modal' : 'Open Login Modal';
            ReactGA.event({
                category: 'User',
                action: eventAction,
                label: 'Authentication'
            });
        }
    }, [showLoginModal, isRegisterMode]);

    // Ensure body scroll is unlocked when component unmounts or reloads
    useEffect(() => {
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, []);

    // Lock body scroll when modals are open (prevents background scrolling on mobile)
    useEffect(() => {
        const isAnyModalOpen = showLoginModal || showPaymentModal || showSettingsModal || showFeedbackModal || showLogoutModal ||
            showDisclaimer || showCloseTradeModal || showReviewModal || showPatternModal || showRiskWarningModal || showSettleModal || showDeleteModal;

        if (isAnyModalOpen) {
            // Lock scroll (Target both html and body for mobile safaris)
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            // Unlock scroll
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [showLoginModal, showPaymentModal, showSettingsModal, showFeedbackModal, showLogoutModal]);

    const t = (path, params = {}) => {
        const keys = path.split('.');
        let value = translations[language];
        for (const key of keys) {
            value = value?.[key];
        }
        if (!value) return path;

        // If it's an object or array, return it directly (for lists like features)
        if (typeof value !== 'string') {
            return value;
        }

        // Simple parameter replacement for strings
        Object.entries(params).forEach(([k, v]) => {
            value = value.replace(new RegExp('{' + k + '}', 'g'), v);
        });
        return value;
    };

    // Toast 自动消失逻辑
    useEffect(() => {
        if (showSuccessToast) {
            const timer = setTimeout(() => setShowSuccessToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccessToast]);

    // 核心数据：交易记录
    const [trades, setTrades] = useState([]);

    const [btcMarket, setBtcMarket] = useState({ price: 0, change24h: 0, loading: true });
    const [totalCapital, setTotalCapital] = useState(0);
    const [accountRiskLimit, setAccountRiskLimit] = useState(10); // Default 10%
    const [isEditingCapital, setIsEditingCapital] = useState(false);

    // 表单状态
    const [activeTab, setActiveTab] = useState(() => {
        const saved = localStorage.getItem('goldcat_active_tab_v2'); // New key to force reset logic
        return saved || 'quantum_terminal'; // Default to AI Observer (Quantum Terminal)
    });

    // Persist active tab
    useEffect(() => {
        localStorage.setItem('goldcat_active_tab_v2', activeTab);
    }, [activeTab]);
    const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission
    const [autoFillData, setAutoFillData] = useState(null); // AI Auto-fill data bridge
    const [isDataLoaded, setIsDataLoaded] = useState(false); // Prevent overwriting local storage before load

    const [showCloseTradeModal, setShowCloseTradeModal] = useState(false);
    const [selectedTradeId, setSelectedTradeId] = useState(null);
    const [closePnL, setClosePnL] = useState('');
    const [violatedDiscipline, setViolatedDiscipline] = useState(false); // 违反纪律标记

    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [paymentTxId, setPaymentTxId] = useState(''); // Payment Transaction ID
    const [orderNumber, setOrderNumber] = useState(''); // USDT Order Number

    // Auto-scroll to top when tab changes or view mode switches
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab, explicitLandingView, showGuestDashboard]);

    // Pattern Management
    const [patterns, setPatterns] = useState(getInitialPatterns(language));
    const [showPatternModal, setShowPatternModal] = useState(false);

    const [newPattern, setNewPattern] = useState('');

    // Risk Warning Modal State
    const [showRiskWarningModal, setShowRiskWarningModal] = useState(false);
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tradeToDelete, setTradeToDelete] = useState(null);
    const [pendingTrade, setPendingTrade] = useState(null);

    // Auto-switch patterns on language change if they match the default of the previous language
    useEffect(() => {
        const zhDefaults = getInitialPatterns('zh');
        const enDefaults = getInitialPatterns('en');
        const areEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

        if (language === 'en' && areEqual(patterns, zhDefaults)) {
            setPatterns(enDefaults);
        } else if (language === 'zh' && areEqual(patterns, enDefaults)) {
            setPatterns(zhDefaults);
        }
    }, [language, patterns]);

    // Load User Data Effect
    useEffect(() => {
        setIsDataLoaded(false); // Reset state on user change

        const loadUserData = async () => {
            if (!user || !user.email) return;

            const userKey = user.email;

            // 1. Total Capital - Load from DB first, fallback to LocalStorage
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('total_capital')
                    .eq('id', user.id)
                    .single();

                if (!error && profile) {
                    setTotalCapital(Number(profile.total_capital) || 0);
                    // Update cache
                    localStorage.setItem(`goldcat_total_capital_${userKey}`, profile.total_capital);
                } else {
                    // Fallback to cache if DB fetch fails or no profile
                    const savedCapitalStr = localStorage.getItem(`goldcat_total_capital_${userKey}`);
                    const savedCapital = parseFloat(savedCapitalStr);
                    if (!isNaN(savedCapital)) {
                        setTotalCapital(savedCapital);
                    }
                }
            } catch (err) {
                if (savedCapitalStr) setTotalCapital(parseFloat(savedCapitalStr));
            }

            // Load Risk Limit from LocalStorage
            const savedRiskLimit = localStorage.getItem(`goldcat_risk_limit_${userKey}`);
            if (savedRiskLimit) {
                setAccountRiskLimit(parseFloat(savedRiskLimit));
            }

            // 2. Load Patterns from Database
            try {
                const { data: patternsData, error: patternsError } = await supabase
                    .from('user_patterns')
                    .select('patterns')
                    .eq('user_id', user.id)
                    .single();

                if (!patternsError && patternsData && patternsData.patterns) {
                    setPatterns(patternsData.patterns);
                } else {
                    // Fallback to localStorage or default
                    const localPatterns = JSON.parse(localStorage.getItem(`goldcat_patterns_${userKey}`));
                    const oldDefault = ['突破 (Breakout)', '回调 (Pullback)', '趋势跟随 (Trend)', '反转 (Reversal)', '区间震荡 (Range)'];
                    let initialPatterns;
                    if (!localPatterns || (localPatterns.length === 5 && localPatterns[0].includes('Breakout'))) {
                        initialPatterns = getInitialPatterns(language);
                    } else {
                        initialPatterns = localPatterns;
                    }
                    setPatterns(initialPatterns);
                    // Migrate to database
                    await supabase.from('user_patterns').upsert({
                        user_id: user.id,
                        patterns: initialPatterns
                    });
                }
            } catch (err) {
                console.error('Error loading patterns:', err);
                const localPatterns = JSON.parse(localStorage.getItem(`goldcat_patterns_${userKey}`)) || getInitialPatterns(language);
                setPatterns(localPatterns);
            }

            // 3. Load Trades from Supabase Database
            try {
                const { data: dbTrades, error: tradesError } = await supabase
                    .from('trades')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('timestamp', { ascending: false });

                if (tradesError) {
                    throw tradesError;
                }

                if (dbTrades) {
                    // 转换数据库格式到前端格式
                    const formattedTrades = dbTrades.map(t => {
                        const riskData = t.risk_analysis || {};
                        return {
                            id: t.id,
                            date: t.date,
                            timestamp: t.timestamp,
                            symbol: t.symbol,
                            direction: t.direction,
                            tradeType: t.direction === 'long' ? 'buy' : 'sell',
                            entryPrice: t.entry_price.toString(),
                            stopLoss: t.stop_loss?.toString() || '',
                            takeProfit: t.take_profit?.toString() || '',
                            margin: t.margin.toString(),
                            leverage: t.leverage.toString(),
                            timeframe: t.timeframe,
                            pattern: t.pattern || '',
                            status: t.status,
                            profitLoss: t.profit_loss || 0,
                            realizedRR: t.realized_rr || null,
                            violatedDiscipline: t.violated_discipline || false,
                            notes: t.notes || '',
                            review: t.review || '',
                            image_url: t.image_url, // ✅ Add image URL
                            rrRatio: riskData.rrRatio,
                            positionSize: riskData.positionSize,
                            riskPercent: riskData.riskPercent,
                            accountRiskPercent: riskData.accountRiskPercent,
                            riskAmount: riskData.riskAmount,
                            valid: riskData.valid
                        };
                    });
                    setTrades(formattedTrades);

                    // One-time Legacy Migration (Optional/Manual trigger preferred, but keeping safe auto-migration for now 
                    // ONLY if DB is empty AND Local has data)
                    if (formattedTrades.length === 0) {
                        const localTrades = JSON.parse(localStorage.getItem(`goldcat_trades_${userKey}`)) || [];
                        if (localTrades.length > 0) {
                            console.log('Found local legacy trades. Asking user to migrate or auto-migrating...');
                            // For improved safety, we will AUTO-MIGRATE one last time to save user data
                            // BUT we will log it heavily and set STATUS.
                            setSyncStatus('saving');
                            let migrationSuccess = true;

                            for (const trade of localTrades) {
                                try {
                                    const direction = trade.direction || (trade.tradeType === 'buy' ? 'long' : 'short');
                                    await supabase.from('trades').insert({
                                        id: trade.id,
                                        user_id: user.id,
                                        date: trade.date,
                                        timestamp: trade.timestamp,
                                        symbol: trade.symbol,
                                        direction: direction,
                                        entry_price: parseFloat(trade.entryPrice),
                                        stop_loss: trade.stopLoss ? parseFloat(trade.stopLoss) : null,
                                        take_profit: trade.takeProfit ? parseFloat(trade.takeProfit) : null,
                                        margin: parseFloat(trade.margin),
                                        leverage: parseFloat(trade.leverage),
                                        timeframe: trade.timeframe,
                                        pattern: trade.pattern,
                                        status: trade.status,
                                        profit_loss: trade.profitLoss || 0,
                                        violated_discipline: trade.violatedDiscipline,
                                        notes: trade.notes,
                                        review: trade.review,
                                        risk_analysis: {
                                            rrRatio: trade.rrRatio,
                                            positionSize: trade.positionSize,
                                            riskPercent: trade.riskPercent,
                                            accountRiskPercent: trade.accountRiskPercent,
                                            riskAmount: trade.riskAmount,
                                            valid: trade.valid
                                        }
                                    });
                                } catch (e) {
                                    console.error("Migration failed for trade", trade.id, e);
                                    migrationSuccess = false;
                                }
                            }

                            if (migrationSuccess) {
                                // Re-fetch to confirm
                                const { data: reloaded } = await supabase.from('trades').select('*').eq('user_id', user.id).order('timestamp', { ascending: false });
                                if (reloaded) {
                                    // Re-map... (simplified for brevity, reuse logic above in real code refactor)
                                    // For now just reload page or let next effect cycle handle it? 
                                    // Better: Copy-paste the mapping logic or extract it.
                                    // Since we are inside the same scope, we can't easily extract without refactoring entire file.
                                    // Let's just set the local trades to state for immediate feedback and set syncStatus.
                                    setTrades(localTrades);
                                    setSyncStatus('synced');
                                    setToastMessage(t('common.migration_success'));
                                    setShowSuccessToast(true);
                                }
                            } else {
                                setSyncStatus('error');
                                setErrorMessage(t('common.migration_error'));
                            }
                        }
                    } else {
                        setSyncStatus('synced');
                    }
                }
            } catch (err) {
                console.error('CRITICAL: Error loading trades from DB:', err);
                setSyncStatus('error');
                const errorMsg = err.message || '';
                if (errorMsg.includes('Failed to fetch') || errorMsg.includes('Network request failed')) {
                    setErrorMessage(language === 'zh' ? '网络连接失败，请检查您的网络设置' : 'Network Error: Please check your connection.');
                } else {
                    setErrorMessage(language === 'zh' ? `数据加载失败: ${errorMsg}` : `Data Load Failed: ${errorMsg}`);
                }
                setShowErrorToast(true);
                // DO NOT FALLBACK TO LOCAL STORAGE HERE. 
                // Showing stale local data while DB is unreachable is the root cause of data loss confusion.
                // Keep trades empty or show error state component.
            }

            // 4. Load Membership and Total Capital from Supabase DB
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setMembership({
                        isPremium: data.is_premium,
                        expiryDate: data.membership_expiry,
                        maxTrades: data.max_trades || 20
                    });

                    // Load Risk Mode from database
                    if (data.risk_mode) {
                        setRiskMode(data.risk_mode);
                    }

                    // Load Total Capital from database
                    if (data.total_capital !== null && data.total_capital !== undefined) {
                        setTotalCapital(data.total_capital);
                    } else {
                        // Fallback to localStorage and migrate to database
                        const localCapital = parseFloat(localStorage.getItem(`goldcat_total_capital_${userKey}`)) || 0;
                        setTotalCapital(localCapital);

                        // Migrate to database
                        await supabase
                            .from('profiles')
                            .update({ total_capital: localCapital })
                            .eq('id', user.id);
                    }
                } else {
                    setMembership({ isPremium: false, expiryDate: null, maxTrades: 20 });
                    setTotalCapital(0);
                }
            } catch (err) {
                console.error('Error loading profile:', err);
                const savedMembership = JSON.parse(localStorage.getItem(`goldcat_membership_${userKey}`)) || { isPremium: false, expiryDate: null, maxTrades: 20 };
                setMembership(savedMembership);

                // Fallback for total capital
                const localCapital = parseFloat(localStorage.getItem(`goldcat_total_capital_${userKey}`)) || 0;
                setTotalCapital(localCapital);
            }
        };

        if (user && user.email) {
            loadUserData().then(() => {
                setIsDataLoaded(true);
            });
        }
    }, [user]);

    // Check active session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            // Tri-state update
            setAuthState(currentUser ? 'authed' : 'guest');
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            // Fix: Also update high-level authState to switch UI from Landing to Dashboard
            setAuthState(currentUser ? 'authed' : 'guest');
        });

        return () => subscription.unsubscribe();
    }, []);

    // Logout cleanup
    useEffect(() => {
        if (!user) {
            setExplicitLandingView(false);
        }
    }, [user]);




    // 持久化副作用 - User Bound
    // useEffect(() => { localStorage.setItem('goldcat_user', JSON.stringify(user)); }, [user]); // No longer needed for user

    useEffect(() => {
        if (user && user.email) {
            // Only sync to local storage as backup, but primary source is DB for membership
            localStorage.setItem(`goldcat_membership_${user.email}`, JSON.stringify(membership));
        }
    }, [membership, user]);

    useEffect(() => {
        if (user && user.email) {
            localStorage.setItem(`goldcat_patterns_${user.email}`, JSON.stringify(patterns));
        }
    }, [patterns, user]);

    // Generate order number when USDT payment method is selected
    useEffect(() => {
        if (paymentMethod === 'usdt' && !orderNumber) {
            setOrderNumber(`ORDER - ${Date.now()} `);
        }
    }, [paymentMethod, orderNumber]);

    useEffect(() => {
        if (user && user.email && isDataLoaded) {
            localStorage.setItem(`goldcat_trades_${user.email}`, JSON.stringify(trades));
        }
    }, [trades, user, isDataLoaded]);

    // Save Capital to DB and localStorage on change
    useEffect(() => {
        if (user && user.email && isDataLoaded) {
            const saveCapital = async () => {
                try {
                    // 1. Save to Supabase (primary storage) - Upsert to handle inconsistencies
                    await supabase
                        .from('profiles')
                        .upsert({ id: user.id, total_capital: totalCapital });

                    // 2. Save to localStorage (cache for faster loading)
                    localStorage.setItem(`goldcat_total_capital_${user.email}`, totalCapital);
                } catch (err) {
                    console.error('Error saving total capital:', err);
                    // Still save to localStorage even if database fails
                    localStorage.setItem(`goldcat_total_capital_${user.email}`, totalCapital);
                }
            };

            // Debounce save to avoid too many DB calls
            const timer = setTimeout(saveCapital, 1000);
            return () => clearTimeout(timer);
        }
    }, [totalCapital, user, isDataLoaded]);

    // 获取实时 BTC 行情
    useEffect(() => {
        const fetchBTCPrice = async () => {
            const now = Date.now();
            const lastFetch = parseInt(localStorage.getItem('last_btc_fetch') || '0');

            // Limit to once every 5 minutes (300000ms) unless force needed
            if (now - lastFetch < 300000 && btcMarket.price > 0) {
                return;
            }

            try {
                // Switch to Binance API (More stable, higher limits, no strict CORS for public ticker)
                const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
                if (!response.ok) throw new Error('Binance API Error');

                const data = await response.json();

                // Binance format: { lastPrice: "65000.00", priceChangePercent: "2.5" }
                setBtcMarket({
                    price: parseFloat(data.lastPrice),
                    change24h: parseFloat(data.priceChangePercent),
                    loading: false
                });
            } catch (error) {
                // Silent error logging to avoid console red spam
                console.log('Using mock BTC data due to fetch error:', error.message);
                // Fallback to mock data
                setBtcMarket({ price: 67500 + Math.random() * 500, change24h: 2.5, loading: false });
            }
        };

        // 立即获取一次
        fetchBTCPrice();

        // 每30秒更新一次
        const interval = setInterval(fetchBTCPrice, 30000);

        return () => clearInterval(interval);
        return () => clearInterval(interval);
    }, []);

    // --- Guest Data Persistence: Auto-save after login ---
    useEffect(() => {
        if (user && pendingGuestTrade) {
            console.log('User logged in with pending guest trade, resuming save...');

            // Short delay to ensure state stability
            const timer = setTimeout(() => {
                handleSubmitTrade();
                setPendingGuestTrade(false);
                setToastMessage(t('common.auto_save_success') || 'Resuming trade save...'); // Fallback strings
                setShowSuccessToast(true);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [user, pendingGuestTrade]);

    // --- 3. 核心业务逻辑 ---

    // Reset payment button state when user returns from Stripe
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isUpgrading) {
                console.log('Page became visible, resetting payment state');
                setIsUpgrading(false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isUpgrading]);


    // v5 Feature: Auto-fill trade form from Quantum Observer
    const fillTradeForm = ({ symbol, side, price, stopLoss, takeProfit }) => {
        console.log('🤖 AI Auto-fill:', { symbol, side, price, stopLoss, takeProfit });
        
        // Pass data to modularized component via bridge state
        setAutoFillData({
            symbol: symbol || '',
            tradeType: side ? (side === 'BUY' ? 'buy' : 'sell') : 'buy',
            entryPrice: price ? price.toString() : '',
            stopLoss: stopLoss ? stopLoss.toString() : '',
            takeProfit: takeProfit ? takeProfit.toString() : ''
        });

        // Switch to Trade Input tab
        setActiveTab('new_trade');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Show feedback
        setToastMessage(t('common.auto_fill_success') || 'Order parameters loaded from AI');
        setShowSuccessToast(true);
    };

    const finalizeTrade = async (trade) => {
        try {
            setSyncStatus('saving');
            // 获取最新用户信息，确保 ID 匹配
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !currentUser) {
                console.error('Auth error:', authError);
                setErrorMessage('您的登录会话已过期，请重新登录后再试。');
                setShowErrorToast(true);
                setSyncStatus('error');
                setTimeout(() => setShowErrorToast(false), 3000);
                return;
            }

            // Debug logs
            console.log('Current User ID:', currentUser.id);

            // 1. 存入数据库
            const { error } = await supabase
                .from('trades')
                .insert({
                    id: trade.id,
                    user_id: currentUser.id, // 使用最新的 currentUser.id
                    date: trade.date,
                    timestamp: trade.timestamp,
                    symbol: trade.symbol,
                    direction: trade.direction,
                    entry_price: parseFloat(trade.entryPrice),
                    stop_loss: trade.stopLoss ? parseFloat(trade.stopLoss) : null,
                    take_profit: trade.takeProfit ? parseFloat(trade.takeProfit) : null,
                    margin: parseFloat(trade.margin),
                    leverage: parseFloat(trade.leverage),
                    timeframe: trade.timeframe,
                    pattern: trade.pattern,
                    status: trade.status,
                    notes: trade.notes || trade.review,
                    review: trade.review,
                    image_url: trade.image_url, // ✅ Add image URL
                    risk_analysis: trade.rrRatio || trade.positionSize ? {
                        rrRatio: trade.rrRatio,
                        positionSize: trade.positionSize,
                        riskPercent: trade.riskPercent,
                        accountRiskPercent: trade.accountRiskPercent,
                        riskAmount: trade.riskAmount,
                        valid: trade.valid
                    } : null
                });

            if (error) {
                console.error('Failed to save trade to database:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
                setErrorMessage('保存交易记录失败: ' + error.message);
                setShowErrorToast(true);
                setSyncStatus('error');
                setTimeout(() => setShowErrorToast(false), 3000);
                return;
            }

            // 2. 更新本地状态 (Strictly only after success)
            setTrades([trade, ...trades]);
            setToastMessage(t('common.success'));
            setShowSuccessToast(true);
            setSyncStatus('synced');

        } catch (err) {
            console.error('Unexpected error saving trade:', err);
            setErrorMessage('保存交易记录失败: ' + err.message);
            setShowErrorToast(true);
            setSyncStatus('error');
            setTimeout(() => setShowErrorToast(false), 3000);
        }
    };

    const handleSubmitTrade = async (capturedFormData = null, capturedRiskAnalysis = null, capturedTradeImage = null) => {
        // Intercept for Guest Mode
        if (!user) {
            setPendingGuestTrade(true); // Flag to save after login
            setIsRegisterMode(true);
            setShowLoginModal(true);
            return;
        }

        if (isSubmitting) return;
        setIsSubmitting(true);
        console.log('handleSubmitTrade called');

        // Allow data to be passed in (modularized component)
        const finalFormData = capturedFormData || formData;
        const finalRiskAnalysis = capturedRiskAnalysis || riskAnalysis;
        const finalTradeImage = capturedTradeImage || tradeImage;

        // 1. 权限检查
        if (!membership.isPremium && trades.length >= membership.maxTrades) {
            setShowPaymentModal(true);
            setPaymentMethod(null);
            setIsSubmitting(false);
            return;
        }

        // 2. 必填检查
        if (!finalFormData.symbol || !finalFormData.entryPrice || !finalFormData.margin) {
            alert("【交易纪律】请完整填写交易要素，不可遗漏。");
            setIsSubmitting(false);
            return;
        }

        let imageUrl = null;

        // 2.5 Image Upload (Premium Only)
        if (finalTradeImage && membership.isPremium) {
            try {
                const fileExt = finalTradeImage.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('trade-images')
                    .upload(fileName, finalTradeImage);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('trade-images')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            } catch (error) {
                console.error('Image upload failed:', error);
                alert(`${t('common.upload_failed')} (${error.message || 'Unknown Error'})`);
            }
        }

        const newTrade = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            ...finalFormData,
            direction: finalFormData.tradeType === 'buy' ? 'long' : 'short',
            ...finalRiskAnalysis,
            status: 'open', // open, win, loss
            profitLoss: 0, // 结单后更新
            image_url: imageUrl // Attach image URL
        };

        // 3. 盈亏比检查（软性提醒）
        if (finalRiskAnalysis.valid && finalRiskAnalysis.rrRatio < 1.5) {
            setPendingTrade(newTrade);
            setShowRiskWarningModal(true);
            setIsSubmitting(false);
            return;
        }

        await finalizeTrade(newTrade);
        setIsSubmitting(false);
    };

    // Upgrade membership - Redirect to Creem payment page (using Checkout Session API)
    // Upgrade membership - Redirect to payment page
    const handleUpgrade = () => {
        if (isUpgrading) return;
        setIsUpgrading(true);

        try {
            // Use the simple redirect method with the configured URL (Stripe/Creem)
            const checkoutUrl = getCheckoutUrl(user?.email, user?.id);
            window.location.href = checkoutUrl;
        } catch (err) {
            console.error('Payment redirect failed:', err);
            setIsUpgrading(false);
            alert(t('common.error_occurred'));
        }
    };

    // Handle Risk Mode Change
    const handleRiskModeChange = async (newMode) => {
        if (!user) return;

        setRiskMode(newMode);

        // Save to Supabase
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ risk_mode: newMode })
                .eq('id', user.id);

            if (error) {
                console.error('Failed to save risk mode:', error);
            }
        } catch (err) {
            console.error('Error saving risk mode:', err);
        }
    };

    // Handle Save Total Capital & Risk Limit
    const handleSaveCapital = () => {
        setIsEditingCapital(false);
        if (user && user.email) {
            localStorage.setItem(`goldcat_risk_limit_${user.email}`, accountRiskLimit);
        }
        // The actual save for capital happens via other logic or just keeps in state/localstorage for now
    };

    // 模拟登录
    // 模拟登录 -> Supabase Login
    const handleLogin = async () => {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(loginForm.email)) {
            setErrorMessage(language === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email address');
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: loginForm.email,
            password: loginForm.password,
        });

        if (error) {
            setErrorMessage(error.message);
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
        } else {
            setShowLoginModal(false);
            setToastMessage(language === 'zh' ? '登录成功' : 'Login Successful');
            setShowSuccessToast(true);
        }
    };

    // 注册逻辑
    // 注册逻辑 -> Supabase Register (Via Secure Edge Function)
    const handleRegister = async () => {
        // Prevent double submission
        if (isSubmitting) {
            console.warn('Registration already in progress, ignoring duplicate click');
            return;
        }
        setIsSubmitting(true);

        // Validate all required fields
        if (!registerForm.email || !registerForm.password || !registerForm.username) {
            setErrorMessage(t('auth.fill_all_fields'));
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            setIsSubmitting(false);
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(registerForm.email)) {
            setErrorMessage(language === 'zh' ? '请输入有效的邮箱地址（例如：user@example.com）' : 'Please enter a valid email address (e.g., user@example.com)');
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            setIsSubmitting(false);
            return;
        }

        if (registerForm.password !== registerForm.confirmPassword) {
            setErrorMessage(t('auth.password_mismatch'));
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            setIsSubmitting(false);
            return;
        }

        // --- SECURE REGISTRATION VIA EDGE FUNCTION ---
        // Backend handles: IP limit check + user creation + session generation
        const { data: funcData, error: funcError } = await supabase.functions.invoke('secure-signup', {
            body: {
                email: registerForm.email,
                password: registerForm.password,
                username: registerForm.username
            }
        });

        // Network-level error (function unreachable)
        if (funcError) {
            console.error('Registration Network Error:', funcError);
            setErrorMessage(language === 'zh' ? '网络错误，请稍后重试' : 'Network error. Please try again.');
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            setIsSubmitting(false);
            return;
        }

        // Backend returned error (with proper HTTP semantics now)
        if (!funcData?.success || funcData?.error) {
            let msg = funcData?.error || 'Unknown error';

            // Localize error messages
            if (msg.includes('Registration limit reached')) {
                msg = language === 'zh' ? '该设备/IP 注册次数已达上限' : 'Registration limit reached for this device/IP.';
            } else if (msg.includes('Email already registered')) {
                msg = language === 'zh' ? '该邮箱已被注册，请直接登录。' : 'Email already registered. Please login.';
            } else if (msg.includes('Password must be at least')) {
                msg = language === 'zh' ? '密码长度不足（至少6位）。' : 'Password is too short (min 6 chars).';
            } else if (msg.includes('Missing required fields')) {
                msg = language === 'zh' ? '请填写所有必填项' : 'Please fill all required fields.';
            }

            setErrorMessage(msg);
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 5000);
            setIsSubmitting(false);
            return;
        }

        // ✅ SUCCESS: Backend returned session tokens
        if (funcData?.session?.access_token && funcData?.session?.refresh_token) {
            try {
                // Directly set session (no frontend sign-in needed)
                await supabase.auth.setSession({
                    access_token: funcData.session.access_token,
                    refresh_token: funcData.session.refresh_token,
                });

                // Success feedback
                setToastMessage(language === 'zh' ? '注册成功！欢迎加入。' : 'Registration successful! Welcome.');
                setShowSuccessToast(true);
                setShowLoginModal(false);

                // Clear form
                setRegisterForm({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });

                console.log('✅ Registration + Auto-login successful');
                setIsSubmitting(false);
            } catch (sessionError) {
                console.error('Failed to set session:', sessionError);
                // Graceful degradation
                setToastMessage(language === 'zh' ? '注册成功！正在为您跳转登录...' : 'Registration successful! Redirecting to login...');
                setShowSuccessToast(true);
                setLoginForm({ email: registerForm.email, password: '' });
                setIsRegisterMode(false);
                setIsSubmitting(false);
            }
        }
        // ⚠️ Rare case: User created but no session (graceful degradation)
        else if (funcData?.user && !funcData?.session) {
            console.warn('User created but session unavailable (backend degraded)');
            setToastMessage(language === 'zh' ? '注册成功！请登录您的账户。' : 'Registration successful! Please log in.');
            setShowSuccessToast(true);
            // Pre-fill login form
            setLoginForm({ email: registerForm.email, password: '' });
            setIsRegisterMode(false);
            // Clear register form
            setRegisterForm({
                username: '',
                email: '',
                password: '',
                confirmPassword: ''
            });
            setIsSubmitting(false);
        }
    };

    // 结算交易 - 打开弹窗
    const handleSettleTrade = (tradeId) => {
        setSelectedTradeId(tradeId);
        setClosePnL('');
        setViolatedDiscipline(false);
        setShowCloseTradeModal(true);
    };

    // 确认结算
    const confirmSettleTrade = async () => {
        if (!closePnL) return;
        const pnlValue = parseFloat(closePnL);
        if (isNaN(pnlValue)) {
            setErrorMessage(t('common.error'));
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            return;
        }

        try {
            setSyncStatus('saving');
            // 获取最新用户信息
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !currentUser) throw new Error('Auth session expired');

            // Calculate realized R-multiple
            // Get the trade to access its planned rrRatio
            const trade = trades.find(t => t.id === selectedTradeId);
            let realizedRR = 0;

            if (trade && trade.rrRatio) {
                const plannedRR = Math.abs(parseFloat(trade.rrRatio));
                if (pnlValue > 0) {
                    // Win: use positive RR
                    realizedRR = plannedRR;
                } else if (pnlValue < 0) {
                    // Loss: use negative RR
                    realizedRR = -plannedRR;
                }
                // If pnlValue === 0, realizedRR stays 0
            }

            // 1. 更新数据库
            const { error } = await supabase
                .from('trades')
                .update({
                    status: 'closed',
                    profit_loss: pnlValue,
                    realized_rr: realizedRR,
                    violated_discipline: violatedDiscipline
                })
                .eq('id', selectedTradeId)
                .eq('user_id', currentUser.id);

            if (error) {
                console.error('Failed to update trade in database:', error);
                alert('结算失败，请重试');
                setSyncStatus('error');
                return;
            }

            // 2. 更新本地状态
            setTrades(trades.map(t =>
                t.id === selectedTradeId
                    ? { ...t, status: 'closed', profitLoss: pnlValue, realizedRR: realizedRR, violatedDiscipline }
                    : t
            ));

            // 更新总资金
            setTotalCapital(prev => prev + pnlValue);

            setShowCloseTradeModal(false);
            setSelectedTradeId(null);
            setShowSuccessToast(true);
            setSyncStatus('synced');
        } catch (err) {
            console.error('Unexpected error settling trade:', err);
            setErrorMessage('结算失败: ' + err.message);
            setShowErrorToast(true);
            setSyncStatus('error');
            setTimeout(() => setShowErrorToast(false), 3000);
        }
    };
    // 复盘交易
    const handleReviewTrade = (trade) => {
        setSelectedTradeId(trade.id);
        setReviewNotes(trade.review || trade.notes || '');
        setShowReviewModal(true);
    };

    const saveReview = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setSyncStatus('saving');
        try {
            // 获取最新用户信息
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !currentUser) throw new Error('Auth session expired');

            // 1. 更新数据库
            const { error } = await supabase
                .from('trades')
                .update({ review: reviewNotes })
                .eq('id', selectedTradeId)
                .eq('user_id', currentUser.id);

            if (error) {
                console.error('Failed to save review:', error);
                setErrorMessage('保存复盘失败，请重试');
                setShowErrorToast(true);
                setSyncStatus('error');
                setTimeout(() => setShowErrorToast(false), 3000);
                return;
            }

            // 2. 更新本地状态
            setTrades(trades.map(t =>
                t.id === selectedTradeId
                    ? { ...t, review: reviewNotes }
                    : t
            ));
            setShowReviewModal(false);
            setShowSuccessToast(true);
            setSyncStatus('synced');
        } catch (err) {
            console.error('Unexpected error saving review:', err);
            setSyncStatus('error');

            // Check if it's an auth error
            if (err.message === 'Auth session expired' || err.message.includes('Auth')) {
                setErrorMessage(t('auth.session_expired') || '会话已过期，请重新登录');
                setShowLoginModal(true); // Open login modal automatically
                // Don't close review modal so user doesn't lose text
            } else {
                setErrorMessage(t('journal.save_failed') + ': ' + err.message);
            }

            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const addPattern = async () => {
        if (newPattern && !patterns.includes(newPattern)) {
            const updatedPatterns = [...patterns, newPattern];
            setPatterns(updatedPatterns);
            setNewPattern('');

            // Sync to database
            if (user?.id) {
                await supabase.from('user_patterns').upsert({
                    user_id: user.id,
                    patterns: updatedPatterns
                });
            }
        }
    };

    const removePattern = async (p) => {
        const updatedPatterns = patterns.filter(item => item !== p);
        setPatterns(updatedPatterns);

        // Sync to database
        if (user?.id) {
            await supabase.from('user_patterns').upsert({
                user_id: user.id,
                patterns: updatedPatterns
            });
        }
    };

    const resetPatterns = async () => {
        const initialPatterns = getInitialPatterns(language);
        setPatterns(initialPatterns);

        // Sync to database
        if (user?.id) {
            await supabase.from('user_patterns').upsert({
                user_id: user.id,
                patterns: initialPatterns
            });
        }
    };

    // 删除交易
    const removeTrade = async (tradeId) => {
        if (!confirm(language === 'zh' ? '确定要删除这条交易记录吗？此操作不可恢复。' : 'Are you sure you want to delete this trade? This cannot be undone.')) return;

        try {
            // 1. 从数据库删除
            if (user?.id) {
                const { error } = await supabase
                    .from('trades')
                    .delete()
                    .eq('id', tradeId)
                    .eq('user_id', user.id);

                if (error) throw error;
            }

            // 2. 更新本地状态
            setTrades(prev => prev.filter(t => t.id !== tradeId));

            // 如果删除的是当前正在结算的交易，清除 pendingTrade
            if (pendingTrade?.id === tradeId) {
                setPendingTrade(null);
                setShowSettleModal(false);
            }
        } catch (err) {
            console.error('Failed to delete trade:', err);
            alert((language === 'zh' ? '删除失败: ' : 'Failed to delete: ') + err.message);
        }
    };

    // 退出登录
    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            // Force clear local state
            setUser(null);
            setTrades([]);
            setTotalCapital(0);
            setMembership({ isPremium: false, expiryDate: null, maxTrades: 20 });
            localStorage.removeItem(`goldcat_membership_${user?.email}`); // Clear specific user cache
            setActiveTab('new_trade');
            setShowLogoutModal(false);
        }
    };

    // 录入交易
    const handleAddTrade = async () => {
        // 验证必填项
        if (!feedbackForm.content) {
            setErrorMessage(t('feedback.content_required'));
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            return;
        }

        try {
            // ... (rest of handleAddTrade logic)
        } catch (err) {
            console.error('Unexpected error adding trade:', err);
            setErrorMessage('添加交易失败: ' + err.message);
            setShowErrorToast(true);
            setSyncStatus('error');
            setTimeout(() => setShowErrorToast(false), 3000);
        }
    };

    // 反馈提交
    const handleSubmitFeedback = async () => {
        // 验证必填项
        if (!feedbackForm.content) {
            setErrorMessage(t('feedback.content_required'));
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            return;
        }

        try {
            const { error } = await supabase
                .from('feedback')
                .insert({
                    user_id: user?.id || null,
                    user_email: feedbackForm.email,
                    user_name: feedbackForm.name || null,
                    feedback_type: feedbackForm.type,
                    content: feedbackForm.content,
                    status: 'pending'
                });

            if (error) {
                console.error('Feedback submission error:', error);
                setErrorMessage(t('feedback.error_msg'));
                setShowErrorToast(true);
                setTimeout(() => setShowErrorToast(false), 3000);
            } else {
                setShowFeedbackModal(false);
                setFeedbackForm({ name: '', email: '', type: 'suggestion', content: '' });
                setErrorMessage(t('feedback.success_msg'));
                setShowSuccessToast(true);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setErrorMessage(t('feedback.error_msg'));
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
        }
    };

    // 统计数据计算
    const stats = useMemo(() => {
        const closedTrades = trades.filter(t => t.status === 'closed');
        const total = closedTrades.length;
        const wins = closedTrades.filter(t => t.profitLoss > 0).length;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
        const totalPnL = closedTrades.reduce((acc, t) => acc + (t.profitLoss || 0), 0);
        return { total, wins, winRate, totalPnL };
    }, [trades]);



    // 导出交易记录
    // 导出交易记录
    const handleExportTrades = () => {
        if (trades.length === 0) return;

        // Helper to escape CSV fields
        const escapeCsvField = (field) => {
            if (field === null || field === undefined) return '';
            const stringField = String(field);
            if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };

        // Define CSV headers
        const headers = [
            'Date', 'Symbol', 'Direction', 'Entry Price', 'Stop Loss', 'Take Profit',
            'Status', 'Result', 'Profit/Loss', 'R:R Ratio', 'Pattern', 'Timeframe', 'Review'
        ];

        // Convert trades to CSV rows
        const csvRows = trades.map(trade => {
            const date = new Date(trade.date).toLocaleDateString();
            const symbol = trade.symbol;
            const direction = trade.direction === 'long' ? 'Long' : 'Short';
            const entry = trade.entryPrice;
            const sl = trade.stopLoss || '-';
            const tp = trade.takeProfit || '-';
            const status = trade.status;
            const result = trade.result || '-';
            const pnl = trade.profitLoss || 0;
            const rr = trade.rrRatio;
            const pattern = trade.pattern || '-';
            const tf = trade.timeframe || '-';
            const review = trade.review || '';

            return [
                date, symbol, direction, entry, sl, tp, status, result, pnl, rr, pattern, tf, review
            ].map(escapeCsvField).join(',');
        });

        // Combine headers and rows
        const csvContent = [headers.join(','), ...csvRows].join('\n');

        // Create download link with BOM for Excel/WPS UTF-8 support
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `trades_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- 4. 界面渲染 ---

    // RENDER STRATEGY:
    // 1. Unknown: Show App Shell & Skeleton (Looks like Dashboard, not Landing)
    // 2. Guest & No Explicit Landing View: Show Guest Dashboard
    // 3. Guest & Explicit Landing View: Show Landing Page (Default)
    // 4. Authed & Explicit Landing View: Show Landing Page
    // 5. Authed: Show Dashboard

    // APP SHELL (SKELETON) - Rendered during 'unknown' auth state
    if (authState === 'unknown') {
        return (
            <div className="fixed inset-0 bg-black text-gray-200 font-sans flex flex-col">
                {/* Skeleton Header */}
                <header className="border-b border-neutral-800 bg-[#050505]/80 backdrop-blur-md h-16 flex items-center justify-between px-4 sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-neutral-800 rounded-full animate-pulse"></div>
                        <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse"></div>
                    </div>
                </header>

                {/* Skeleton Content (Dashboard Structure) */}
                <div className="flex-1 max-w-7xl mx-auto w-full px-4 pt-6">
                    {/* Tab Bar Skeleton */}
                    <div className="flex gap-2 mb-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 w-24 bg-neutral-900 border border-neutral-800 rounded-xl animate-pulse"></div>
                        ))}
                    </div>

                    {/* Main Content Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Panel */}
                        <div className="lg:col-span-2 h-[500px] bg-neutral-900/50 border border-neutral-800 rounded-2xl animate-pulse"></div>
                        {/* Right Panel */}
                        <div className="h-[500px] bg-neutral-900/50 border border-neutral-800 rounded-2xl animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black text-gray-200 font-sans selection:bg-amber-500/30 notranslate flex flex-col" translate="no">

            {/* Background Animation (KuCoin Style) */}
            {/* Background Particles - REMOVED to improve load speed */}

            {/* 顶部导航栏 (Header) */}
            <header className="border-b border-neutral-800 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => {
                            if (!user) {
                                setShowGuestDashboard(false);
                            } else {
                                setExplicitLandingView(true);
                            }
                        }}
                    >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                            <img src="/goldcat_logo_neon.png" alt="GoldCat Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tighter leading-none">
                                {t('app_title')} <span className="text-amber-500 text-[10px] align-top">v4</span>
                            </h1>

                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <SyncStatusIndicator status={syncStatus} language={language} />
                                <div className="hidden md:flex items-center gap-2 mr-4">
                                    <span className="text-xs text-gray-400">{t('nav.recorded_trades')}</span>
                                    <span className={`text-sm font-bold font-mono ${trades.length >= membership.maxTrades && !membership.isPremium ? 'text-red-500' : 'text-white'}`}>
                                        {trades.length} <span className="text-gray-600 text-xs">/ {membership.isPremium ? '∞' : membership.maxTrades}</span>
                                    </span>
                                </div>
                                {!membership.isPremium && (
                                    <button onClick={() => { setShowPaymentModal(true); setPaymentMethod(null); }} className="bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> {t('nav.upgrade')}
                                    </button>
                                )}
                                <button onClick={() => setShowSettingsModal(true)} className={`h-9 px-3 rounded-full flex items-center justify-center border transition-colors group relative gap-2 ${membership.isPremium ? 'bg-neutral-800 border-amber-500/50' : 'bg-neutral-800 border-neutral-700 hover:border-amber-500'}`}>
                                    {membership.isPremium && <Crown className="w-3 h-3 text-amber-500" />}
                                    <div className="flex flex-col items-start leading-none">
                                        <span className={`text-sm font-bold ${membership.isPremium ? 'text-amber-500' : 'text-gray-300'}`}>{user.user_metadata?.username || user.email?.split('@')[0]}</span>
                                        <span className="text-[10px] text-gray-500">{user.email}</span>
                                    </div>
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setShowLoginModal(true)} className="text-sm font-bold text-amber-500 hover:text-amber-400">{t('nav.login_register')}</button>
                        )}
                        <button
                            onClick={() => setLanguage(l => l === 'zh' ? 'en' : 'zh')}
                            className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 text-xs font-bold text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                        >
                            <Globe className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>


            {/* Fortune Compass Widget - Moved below per user request */}
            {/*
            {
                user && activeTab === 'new_trade' && (
                    <div className="max-w-7xl mx-auto px-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <FortuneCompass
                            language={language}
                            t={t}
                            user={user}
                            isPremium={membership.isPremium}
                            onOpenSettings={() => setShowSettingsModal(true)}
                            onUpgrade={() => { setShowPaymentModal(true); setPaymentMethod(null); }}
                        />
                    </div>
                )
            }
            */}

            <main className="w-full max-w-7xl mx-auto px-4 py-6 pb-20 relative flex-1 overflow-y-auto">

                {/* 登录引导 */}
                {/* 登录引导 (Landing Page Redesign) */}
                {((!user && !showGuestDashboard) || (user && explicitLandingView)) && (
                    <div className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-black">


                        <style>{`
                            @keyframes grid-move {
                                0% { transform: perspective(500px) rotateX(60deg) translateY(0px); }
                                100% { transform: perspective(500px) rotateX(60deg) translateY(40px); }
                            }
                            @keyframes aurora {
                                0% { background-position: 50% 50%; }
                                50% { background-position: 100% 50%; }
                                100% { background-position: 50% 50%; }
                            }
                            @keyframes twinkle {
                                0%, 100% { opacity: 0.2; transform: scale(0.8); }
                                50% { opacity: 1; transform: scale(1.2); }
                            }
                            .animate-grid {
                                animation: grid-move 3s linear infinite;
                            }
                            .bg-aurora {
                                background: radial-gradient(circle at 50% 0%, #451a03, #172554, #000000);
                                background-size: 200% 200%;
                                animation: aurora 20s ease infinite;
                            }
                            @keyframes shake {
                                0%, 100% { transform: translateX(0); }
                                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                                20%, 40%, 60%, 80% { transform: translateX(5px); }
                            }
                            .animate-shake {
                                animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                            }
                        `}</style>

                        {/* Dynamic Background */}
                        <div className="absolute inset-0 bg-black overflow-hidden">
                            {/* Aurora Top Glow */}
                            <div className="absolute inset-0 bg-aurora opacity-40"></div>

                            {/* Perspective Grid with Fade Mask */}
                            <div className="absolute inset-0 flex items-end justify-center opacity-30 pointer-events-none" style={{ maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)' }}>
                                <div className="w-[200%] h-[100%] -mb-[20%] bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] animate-grid origin-bottom"></div>
                            </div>

                            {/* Vignette for seamless blending */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>
                        </div>

                        <div className="relative z-10 max-w-5xl mx-auto animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-8 py-20">


                            <h1 className={`text-3xl xs:text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-6 sm:mb-8 tracking-tighter leading-[1.1] drop-shadow-2xl whitespace-pre-line break-words max-w-[95vw]`}>
                                {t('home.quantum_hero_title')}
                            </h1>

                            {/* Simplified Subtitle */}
                            {/* Quantum Observer Subtitle */}
                            <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-[2] drop-shadow-md px-4">
                                {t('home.quantum_hero_subtitle')}
                            </p>


                            <div className="flex flex-col md:flex-row items-start justify-center gap-6 mb-20">
                                <div className="flex flex-col items-center gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => {
                                            if (user) {
                                                setActiveTab('quantum_terminal');
                                                setExplicitLandingView(false);
                                            } else {
                                                setShowGuestDashboard(true);
                                                setActiveTab('quantum_terminal');
                                            }
                                        }}
                                        className="group relative w-full md:w-auto bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-black text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-5 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_rgba(168,85,247,0.7)] hover:scale-105 transition-all flex items-center justify-center gap-3 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        <span className="relative flex items-center gap-2">{t('home.quantum_hero_cta')} <ChevronRight className="w-6 h-6" /></span>
                                    </button>

                                    {/* System Status Badge */}
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-1000 mt-3 md:mt-4 flex justify-center w-full">
                                        <div className="flex items-center gap-2 text-[#A1A1AA] text-xs sm:text-[13px] font-mono tracking-wider">
                                            <span className="relative flex h-1.5 w-1.5 mr-0.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75 duration-2000"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22C55E]"></span>
                                            </span>
                                            <span>
                                                {t('home.quantum_hero_stats', { count: challengeCount })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsRegisterMode(false);
                                        setShowLoginModal(true);
                                    }}
                                    className="w-full md:w-auto bg-white/5 hover:bg-white/10 text-white font-bold text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm self-start md:self-auto"
                                >
                                    {t('auth.login_btn')}
                                </button>
                            </div>

                            {/* Feature Grid - Reordered for Quantum First */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                {/* 1. Quantum Observer (Promoted) */}
                                <div
                                    onClick={() => { setShowGuestDashboard(true); setExplicitLandingView(false); setActiveTab('quantum_terminal'); }}
                                    className="bg-black/40 backdrop-blur-md border border-purple-500/30 p-8 rounded-3xl hover:border-purple-500/70 hover:bg-black/60 transition-all group hover:-translate-y-1 duration-300 cursor-pointer relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.15)] order-1"
                                >
                                    <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-transparent text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">
                                        {t('home.feature_quantum_badge')}
                                    </div>
                                    <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.2)] border border-purple-500/30">
                                        <Cpu className="w-7 h-7 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors flex items-center gap-2">
                                        {t('home.feature_quantum_title')}
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed mb-4">{t('home.feature_quantum_desc')}</p>
                                    <div className="flex items-center gap-2 text-xs text-purple-400 font-mono bg-purple-900/20 px-2 py-1 rounded border border-purple-500/20 w-fit">
                                        <Sparkles className="w-3 h-3" /> {t('home.feature_quantum_accuracy')}
                                    </div>
                                </div>

                                {/* 2. Daily Alpha */}
                                <div
                                    onClick={() => { setShowGuestDashboard(true); setExplicitLandingView(false); setActiveTab('daily_alpha'); }}
                                    className="bg-black/40 backdrop-blur-md border border-white/5 p-8 rounded-3xl hover:border-amber-500/50 hover:bg-black/60 transition-all group hover:-translate-y-1 duration-300 cursor-pointer order-2"
                                >
                                    <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.1)] border border-amber-500/20">
                                        <Newspaper className="w-7 h-7 text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">{t('home.feature_intel_title')}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{t('home.feature_intel_desc')}</p>
                                </div>

                                {/* 3. Manual Entry (Demoted) */}
                                <div
                                    onClick={() => { setShowGuestDashboard(true); setExplicitLandingView(false); setActiveTab('new_trade'); }}
                                    className="bg-black/40 backdrop-blur-md border border-white/5 p-8 rounded-3xl hover:border-gray-500/50 hover:bg-black/60 transition-all group hover:-translate-y-1 duration-300 cursor-pointer order-3"
                                >
                                    <div className="w-14 h-14 bg-gray-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(107,114,128,0.1)] border border-gray-500/20">
                                        <Edit3 className="w-7 h-7 text-gray-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-300 mb-3 group-hover:text-white transition-colors">{t('home.feature_manual_title')}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">{t('home.feature_manual_desc')}</p>
                                </div>
                            </div>

                            {/* --- New Feature Showcase Cards (Added per user request) --- */}
                            {/* --- Tactical Radar System (Full Width, Dynamic Visualization) --- */}
                            <div className="hidden md:block mt-32 max-w-6xl mx-auto px-4">
                                <div className="bg-[#0a0a0c] border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
                                    {/* Radar Scan Overlay */}
                                    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                                        <div className="w-[200%] h-full absolute top-0 left-[-50%] bg-gradient-to-r from-transparent via-amber-500/5 to-transparent skew-x-12 animate-[scan_4s_linear_infinite]"></div>
                                    </div>

                                    {/* Header */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                                                <Radar className="w-6 h-6 text-amber-500 animate-[spin_4s_linear_infinite]" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em] mb-1">{t('home.tactical_radar_subtitle')}</div>
                                                <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">
                                                    {t('home.tactical_radar_title')}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="mt-4 md:mt-0 flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-xs text-slate-400 font-mono">SYSTEM ONLINE</span>
                                        </div>
                                    </div>

                                    {/* Dynamic Wave Visualization (Simulated K-Lines) */}
                                    <div className="grid grid-cols-1 gap-4 relative z-10">
                                        {/* 1M: Micro Field */}
                                        <div className="bg-black/40 border border-slate-800/50 rounded-xl p-4 relative overflow-hidden h-32 group/chart">
                                            {/* Scanner Beam */}
                                            <div className="absolute top-0 bottom-0 w-[2px] bg-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-20 animate-[scan-beam_3s_linear_infinite]" style={{ left: '0%' }}>
                                                <div className="absolute top-0 bottom-0 left-[-20px] w-[40px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent"></div>
                                            </div>

                                            <div className="flex justify-between items-center mb-2 relative z-30">
                                                <span className="text-[10px] text-cyan-400 font-mono font-bold tracking-wider">1M: {language === 'zh' ? '微观场' : 'MICRO'} (ZENUSDT)</span>
                                                <div className="flex gap-2">
                                                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 rounded border border-slate-700">RSI: 33.2</span>
                                                    <span className="text-[9px] text-slate-500">AI_NOISE</span>
                                                </div>
                                            </div>
                                            {/* Cyan Line (Smooth Organic Trend) */}
                                            <svg className="absolute bottom-0 left-0 w-full h-20 opacity-90" preserveAspectRatio="none" viewBox="0 0 1200 100">
                                                <defs>
                                                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                                                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <path d="M0,80 C50,75 100,85 150,70 C200,55 250,75 300,65 C350,55 400,30 450,40 C500,50 550,20 600,15 C650,10 700,35 750,25 C800,15 850,40 900,45 C950,50 1000,10 1050,15 C1100,20 1150,30 1200,25 V100 H0 Z" fill="url(#cyanGradient)" stroke="none" />
                                                <path d="M0,80 C50,75 100,85 150,70 C200,55 250,75 300,65 C350,55 400,30 450,40 C500,50 550,20 600,15 C650,10 700,35 750,25 C800,15 850,40 900,45 C950,50 1000,10 1050,15 C1100,20 1150,30 1200,25" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>

                                        {/* 5M: Structure Field */}
                                        <div className="bg-black/40 border border-slate-800/50 rounded-xl p-4 relative overflow-hidden h-32 group/chart">
                                            {/* Scanner Beam */}
                                            <div className="absolute top-0 bottom-0 w-[2px] bg-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.8)] z-20 animate-[scan-beam_4s_linear_infinite_1s]" style={{ left: '0%' }}>
                                                <div className="absolute top-0 bottom-0 left-[-20px] w-[40px] bg-gradient-to-r from-transparent via-purple-500/10 to-transparent"></div>
                                            </div>

                                            <div className="flex justify-between items-center mb-2 relative z-30">
                                                <span className="text-[10px] text-purple-400 font-mono font-bold tracking-wider">5M: {language === 'zh' ? '结构场' : 'STRUCTURE'} (ZENUSDT)</span>
                                                <div className="flex gap-2">
                                                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 rounded border border-slate-700">RSI: 35.0</span>
                                                    <span className="text-[9px] text-slate-500">WAVE_PATTERN</span>
                                                </div>
                                            </div>
                                            {/* Purple Line (Smooth Organic Trend) */}
                                            <svg className="absolute bottom-0 left-0 w-full h-20 opacity-90" preserveAspectRatio="none" viewBox="0 0 1200 100">
                                                <defs>
                                                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
                                                        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <path d="M0,50 C60,55 120,45 180,52 C240,58 300,70 360,65 C420,60 480,45 540,50 C600,55 660,40 720,35 C780,30 840,45 900,38 C960,30 1020,15 1080,20 C1140,25 1170,18 1200,15 V100 H0 Z" fill="url(#purpleGradient)" stroke="none" />
                                                <path d="M0,50 C60,55 120,45 180,52 C240,58 300,70 360,65 C420,60 480,45 540,50 C600,55 660,40 720,35 C780,30 840,45 900,38 C960,30 1020,15 1080,20 C1140,25 1170,18 1200,15" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>

                                        {/* 1H: Macro Field */}
                                        <div className="bg-black/40 border border-slate-800/50 rounded-xl p-4 relative overflow-hidden h-32 group/chart">
                                            {/* Scanner Beam */}
                                            <div className="absolute top-0 bottom-0 w-[2px] bg-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.8)] z-20 animate-[scan-beam_5s_linear_infinite_0.5s]" style={{ left: '0%' }}>
                                                <div className="absolute top-0 bottom-0 left-[-20px] w-[40px] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"></div>
                                            </div>

                                            <div className="flex justify-between items-center mb-2 relative z-30">
                                                <span className="text-[10px] text-amber-400 font-mono font-bold tracking-wider">1H: {language === 'zh' ? '宏观场' : 'MACRO'} (ZENUSDT)</span>
                                                <div className="flex gap-2">
                                                    <span className="text-[9px] text-green-500 font-bold tracking-wider pr-2">LONG_SIG[1]</span>
                                                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 rounded border border-slate-700">RSI: 39.5</span>
                                                    <span className="text-[9px] text-slate-500">GRAVITY_WELL</span>
                                                </div>
                                            </div>
                                            {/* Yellow Line (Smooth Organic Trend) */}
                                            <div className="absolute top-1/2 left-[60%] w-2 h-2 bg-green-500 rounded-full animate-ping z-20"></div>
                                            <svg className="absolute bottom-0 left-0 w-full h-20 opacity-90" preserveAspectRatio="none" viewBox="0 0 1200 100">
                                                <defs>
                                                    <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
                                                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <path d="M0,70 C50,72 100,75 150,65 C200,55 250,50 300,30 C350,10 400,25 450,45 C500,65 550,70 600,60 C650,50 700,55 750,65 C800,75 850,45 900,40 C950,35 1000,45 1050,40 C1100,35 1150,50 1200,55 V100 H0 Z" fill="url(#amberGradient)" stroke="none" />
                                                <path d="M0,70 C50,72 100,75 150,65 C200,55 250,50 300,30 C350,10 400,25 450,45 C500,65 550,70 600,60 C650,50 700,55 750,65 C800,75 850,45 900,40 C950,35 1000,45 1050,40 C1100,35 1150,50 1200,55" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 border-t border-slate-800/50 pt-4">
                                        <p className="hidden md:block max-w-2xl text-center md:text-left leading-relaxed">
                                            {t('home.tactical_radar_desc')}
                                        </p>
                                        <button
                                            onClick={() => {
                                                setActiveTab('quantum_terminal');
                                                window.scrollTo(0, 0);
                                                if (user) {
                                                    setExplicitLandingView(false);
                                                } else {
                                                    setShowGuestDashboard(true);
                                                }
                                            }}
                                            className="mt-4 md:mt-0 px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2"
                                        >
                                            <Activity className="w-4 h-4" />
                                            {t('home.tactical_radar_button')}
                                        </button>
                                    </div>
                                </div>
                            </div>


                            {/* --- Pricing Section (Added for Compliance) --- */}
                            <div className="animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300 mt-32">
                                <div className="text-center mb-16">
                                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight">{t('pricing.title')}</h2>
                                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                                        {t('pricing.subtitle')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto relative group-hover:gap-12 transition-all duration-500">
                                    {/* Free Plan */}
                                    <div className="relative bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-white/20 transition-all hover:-translate-y-2 duration-300 flex flex-col text-left items-start">
                                        <div className="mb-8 w-full">
                                            <h3 className="text-xl font-bold text-white mb-2">{t('pricing.free_title')}</h3>
                                            <div className="flex items-baseline gap-1 mb-4">
                                                <span className="text-4xl font-black text-white">{t('pricing.free_price')}</span>
                                            </div>
                                            <p className="text-gray-400 text-sm">{t('pricing.free_desc')}</p>
                                        </div>
                                        <div className="border-t border-white/10 my-8 w-full"></div>
                                        <ul className="space-y-4 mb-8 flex-1 w-full">
                                            {Array.isArray(t('pricing.free_features')) && t('pricing.free_features').map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3 text-gray-300">
                                                    <Check className="w-5 h-5 text-gray-500 shrink-0" />
                                                    <span className="text-sm">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => {
                                                if (user) {
                                                    setActiveTab('new_trade');
                                                    setExplicitLandingView(false);
                                                } else {
                                                    setIsRegisterMode(true);
                                                    setShowLoginModal(true);
                                                }
                                            }}
                                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all"
                                        >
                                            {user ? t('pricing.go_dashboard') : t('pricing.start_free')}
                                        </button>
                                    </div>

                                    {/* Lifetime Plan */}
                                    <div className="relative bg-gradient-to-br from-red-500/10 to-rose-500/5 backdrop-blur-md border-2 border-red-500/50 rounded-3xl p-6 sm:p-8 hover:border-red-400/70 transition-all hover:-translate-y-2 duration-300 flex flex-col text-left items-start shadow-[0_0_40px_rgba(239,68,68,0.15)]">
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg border border-red-400/30">
                                            <Crown className="w-3 h-3 text-white" /> {t('pricing.pro_badge')}
                                        </div>
                                        <div className="mb-8 w-full">
                                            <h3 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2">
                                                {t('pricing.pro_title')}
                                            </h3>
                                            <div className="mb-2">
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-5xl font-black text-white">$39.00</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-400 text-sm">{t('pricing.pro_desc')}</p>
                                        </div>
                                        <div className="border-t border-white/10 my-8 w-full"></div>
                                        <ul className="space-y-4 mb-8 flex-1 w-full">
                                            {Array.isArray(t('pricing.pro_features')) && t('pricing.pro_features').map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3 text-white">
                                                    <div className="bg-red-500/20 rounded-full p-0.5">
                                                        <Check className="w-4 h-4 text-red-500 shrink-0" />
                                                    </div>
                                                    <span className="text-sm font-medium">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            disabled={membership.isPremium}
                                            onClick={() => {
                                                if (membership.isPremium) return;

                                                if (user) {
                                                    setShowPaymentModal(true);
                                                    setPaymentMethod(null);
                                                } else {
                                                    setIsRegisterMode(true);
                                                    setShowLoginModal(true);
                                                }
                                            }}
                                            className={`group relative w-full py-4 ${membership.isPremium
                                                ? 'bg-neutral-800 text-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-[0_0_60px_rgba(239,68,68,0.5)] hover:-translate-y-1'} 
                                                font-black text-lg rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.3)] transition-all overflow-hidden`}
                                        >
                                            {membership.isPremium ? t('pricing.current_plan') : t('pricing.get_pro')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* FAQ Section */}
                            <div className="max-w-4xl mx-auto mt-32 mb-20 px-4">
                                {/* JSON-LD Schema Markup for SEO */}
                                <script type="application/ld+json" dangerouslySetInnerHTML={{
                                    __html: JSON.stringify({
                                        "@context": "https://schema.org",
                                        "@type": "FAQPage",
                                        "mainEntity": Array.isArray(t('faq.items')) ? t('faq.items').map(item => ({
                                            "@type": "Question",
                                            "name": item.q,
                                            "acceptedAnswer": {
                                                "@type": "Answer",
                                                "text": item.a.replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown formatting
                                            }
                                        })) : []
                                    })
                                }} />

                                <div className="text-center mb-12">
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4 tracking-tight">{t('faq.title')}</h2>
                                    <p className="text-gray-400 text-sm md:text-base">{t('faq.subtitle')}</p>
                                </div>

                                <div className="space-y-4">
                                    {Array.isArray(t('faq.items')) && t('faq.items').map((item, index) => (
                                        <div key={index} className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden hover:bg-neutral-900/80 transition-colors p-5 sm:p-6 md:p-8 text-left">
                                            <h3 className="text-base sm:text-lg font-bold text-amber-500 mb-3 sm:mb-4">{item.q}</h3>
                                            <div className="text-gray-400 text-sm md:text-base leading-relaxed">
                                                <div dangerouslySetInnerHTML={{ __html: item.a.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-200">$1</strong>') }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div >
                    </div >
                )
                }

                {
                    ((user && !explicitLandingView) || (!user && showGuestDashboard)) && (
                        <>
                            {/* 功能 Tab */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-[18px]">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'quantum_terminal', label: t('nav.quantum_terminal'), icon: Cpu },
                                        { id: 'daily_alpha', label: t('nav.daily_alpha'), icon: Newspaper },
                                        { id: 'new_trade', label: t('nav.new_trade'), icon: Plus },
                                        { id: 'journal', label: t('nav.journal'), icon: FileText },
                                        { id: 'ai_analysis', label: t('nav.ai_analysis'), icon: Brain },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                flex items-center justify-center gap-2 px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap
                                ${activeTab === tab.id
                                                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105'
                                                    : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700 hover:text-white border border-neutral-600'
                                                }
                                ${tab.className || ''}
                            `}
                                        >
                                            {tab.icon && <tab.icon className="w-5 h-5 sm:w-4 sm:h-4" />}
                                            <span className="hidden xs:inline sm:inline">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>



                            {/* --- 1. 录入交易 (核心) --- */}
                            {activeTab === 'new_trade' && (
                                <TradeEntryForm
                                    t={t}
                                    language={language}
                                    user={user}
                                    membership={membership}
                                    trades={trades}
                                    btcMarket={btcMarket}
                                    totalCapital={totalCapital}
                                    setTotalCapital={setTotalCapital}
                                    accountRiskLimit={accountRiskLimit}
                                    setAccountRiskLimit={setAccountRiskLimit}
                                    handleSaveCapital={handleSaveCapital}
                                    patterns={patterns}
                                    onManagePatterns={() => setShowPatternModal(true)}
                                    onRequireLogin={() => {
                                        setPendingGuestTrade(true);
                                        setIsRegisterMode(true);
                                        setShowLoginModal(true);
                                    }}
                                    onRequireUpgrade={() => {
                                        setShowPaymentModal(true);
                                        setPaymentMethod(null);
                                    }}
                                    onSubmit={handleSubmitTrade}
                                    isSubmitting={isSubmitting}
                                    autoFillData={autoFillData}
                                    onAutoFillApplied={() => setAutoFillData(null)}
                                    onShowSuccess={(msg) => { setToastMessage(msg); setShowSuccessToast(true); }}
                                    onShowError={(msg) => { setToastMessage(msg); setShowErrorToast(true); }}
                                />

                            )}

                            {/* --- 2. 交易日记列表 --- */}
                            {activeTab === 'journal' && (
                                <div
                                    className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4"
                                    ref={(el) => {
                                        if (el) {
                                            console.log('🔍 Journal Tab Grid Container Width:', el.offsetWidth);
                                            const child = el.querySelector('.lg\\:col-span-3');
                                            if (child) {
                                                console.log('🔍 Journal Tab Content Width:', child.offsetWidth);
                                            }
                                        }
                                    }}
                                >
                                    <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                                        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                                            <h2 className="text-xl font-bold text-white">{t('journal.title')}</h2>
                                            <div className="text-sm text-gray-400 flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span>{t('journal.total_trades')}: <span className="text-white font-bold">{trades.length}</span></span>
                                                    <span className="text-gray-600">|</span>
                                                    <span>{t('journal.win_rate')}: <span className="text-amber-500 font-bold">{stats.winRate}%</span></span>
                                                    <span className="text-gray-600">|</span>
                                                    <span>{t('journal.net_pnl')}: <span className={stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}>${stats.totalPnL.toFixed(2)}</span></span>
                                                </div>
                                                <button
                                                    onClick={handleExportTrades}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs rounded-lg border border-neutral-700 transition-colors"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    {t('journal.export_csv')}
                                                </button>
                                            </div>
                                        </div>
                                        {trades.length === 0 ? (
                                            <div className="p-20 text-center text-gray-600">
                                                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                                <p>{t('journal.empty_state')}</p>
                                            </div>
                                        ) : (
                                            <div className="max-h-[calc(100vh-320px)] min-h-[300px] overflow-y-auto overflow-x-hidden">
                                                <div className="overflow-x-auto -mx-4 sm:mx-0 pb-2">
                                                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[640px]">
                                                        <thead className="text-xs text-gray-500 bg-neutral-900/50 uppercase tracking-wider relative">
                                                            <tr>
                                                                <th className="px-4 py-4 bg-neutral-800 sticky top-0 z-20 font-medium min-w-[100px]">{t('journal.columns.date')}</th>
                                                                <th className="px-4 py-4 bg-neutral-800 sticky top-0 z-20 font-medium min-w-[120px]">{t('journal.columns.symbol_dir')}</th>
                                                                <th className="px-4 py-4 bg-neutral-800 sticky top-0 z-20 font-medium min-w-[180px]">{t('journal.columns.basis')}</th>
                                                                <th className="px-4 py-4 bg-neutral-800 sticky top-0 z-20 font-medium min-w-[60px] text-center">{t('journal.columns.chart') || <ImageIcon className="w-4 h-4 mx-auto" />}</th>
                                                                <th className="px-4 py-4 bg-neutral-800 sticky top-0 z-20 font-medium min-w-[80px]">{t('journal.columns.rr')}</th>
                                                                <th className="px-4 py-4 bg-neutral-800 sticky top-0 z-20 font-medium min-w-[100px]">{t('journal.columns.status')}</th>
                                                                <th className="px-4 py-4 bg-neutral-800 sticky top-0 z-20 font-medium min-w-[200px] max-w-[300px]">{t('journal.columns.review_content')}</th>
                                                                <th className="px-4 py-4 bg-neutral-800 sticky top-0 z-20 text-center min-w-[180px]">{t('journal.columns.action')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-neutral-800">
                                                            {trades.map(trade => (
                                                                <tr key={trade.id} className="hover:bg-neutral-800/50 transition-colors">
                                                                    <td className="px-4 py-4 font-mono text-gray-400 text-xs">{trade.date}</td>
                                                                    <td className="px-4 py-4">
                                                                        <div className="font-bold text-white text-sm">{trade.symbol}</div>
                                                                        <div className={`text-xs ${trade.tradeType === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                                                            {trade.tradeType === 'buy' ? t('form.long') : t('form.short')} x{trade.leverage}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-4">
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="bg-neutral-800 text-gray-300 px-2 py-1 rounded text-xs border border-neutral-700 inline-block w-fit">
                                                                                {trade.timeframe}
                                                                            </span>
                                                                            <span className="text-gray-400 text-xs">{trade.pattern || '-'}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-4 text-center">
                                                                        {trade.image_url ? (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    window.open(trade.image_url, '_blank');
                                                                                }}
                                                                                className="p-1.5 bg-neutral-800 rounded-lg hover:bg-neutral-700 border border-neutral-700 text-amber-500 transition-colors mx-auto"
                                                                                title={t('journal.view_chart') || 'View Chart'}
                                                                            >
                                                                                <ImageIcon className="w-4 h-4" />
                                                                            </button>
                                                                        ) : (
                                                                            <span className="text-neutral-700">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-4 font-mono group relative text-sm">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span>{trade.rrRatio}</span>
                                                                            <Info className="w-3.5 h-3.5 text-gray-600 group-hover:text-amber-500 transition-colors" />
                                                                        </div>
                                                                        {/* Tooltip with price details */}
                                                                        <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 w-44 p-3 bg-black border border-neutral-700 rounded-lg shadow-xl text-xs text-left text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                                                                            <div className="space-y-1.5">
                                                                                <div className="flex justify-between gap-3">
                                                                                    <span className="text-gray-400">{t('journal.entry_price')}</span>
                                                                                    <span className="text-amber-400 font-mono">${parseFloat(trade.entryPrice).toFixed(2)}</span>
                                                                                </div>
                                                                                {trade.stopLoss && (
                                                                                    <div className="flex justify-between gap-3">
                                                                                        <span className="text-gray-400">{t('journal.stop_loss_price')}</span>
                                                                                        <span className="text-red-400 font-mono">${parseFloat(trade.stopLoss).toFixed(2)}</span>
                                                                                    </div>
                                                                                )}
                                                                                {trade.takeProfit && (
                                                                                    <div className="flex justify-between gap-3">
                                                                                        <span className="text-gray-400">{t('journal.take_profit_price')}</span>
                                                                                        <span className="text-green-400 font-mono">${parseFloat(trade.takeProfit).toFixed(2)}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-4">
                                                                        <div className="flex items-center gap-2">
                                                                            {trade.status === 'open' ? (
                                                                                <span className="text-amber-500 text-xs font-bold border border-amber-500/30 px-2 py-1 rounded-full">{t('journal.status.open')}</span>
                                                                            ) : (
                                                                                <>
                                                                                    <span className={`text-xs font-bold ${trade.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                                        {trade.profitLoss >= 0 ? '+' : '-'}${Math.abs(trade.profitLoss).toFixed(2)}
                                                                                    </span>
                                                                                    {trade.violatedDiscipline && (
                                                                                        <span className="text-red-500 text-base" title={t('risk.violation')}>⚠️</span>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-4 max-w-[300px]">
                                                                        {(trade.review || trade.notes) ? (
                                                                            <div className="text-xs text-gray-300 truncate" title={trade.review || trade.notes}>
                                                                                {trade.review || trade.notes}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-xs text-gray-600 italic">{t('journal.not_reviewed')}</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-4">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            {/* Settle/Closed button */}
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (trade.status === 'open') {
                                                                                        handleSettleTrade(trade.id);
                                                                                    }
                                                                                }}
                                                                                disabled={trade.status !== 'open'}
                                                                                className={`
                                                                            px-3 py-1.5 rounded border text-xs font-bold transition-all min-w-[70px]
                                                                            ${trade.status === 'open'
                                                                                        ? 'border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black'
                                                                                        : 'border-neutral-700 text-gray-600 cursor-not-allowed bg-neutral-800/50'}
                                                                        `}
                                                                            >
                                                                                {trade.status === 'open' ? t('journal.settle') : t('journal.status.closed')}
                                                                            </button>

                                                                            {/* Review button */}
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleReviewTrade(trade);
                                                                                }}
                                                                                className={`
                                                                            px-3 py-1.5 rounded text-xs font-medium transition-all w-[100px] flex items-center justify-center gap-1
                                                                            ${trade.review
                                                                                        ? 'bg-green-900/30 text-green-400 border border-green-500/30 hover:bg-green-900/50'
                                                                                        : 'bg-neutral-800 text-gray-400 border border-neutral-700 hover:bg-neutral-700 hover:text-white'}
                                                                        `}
                                                                            >
                                                                                {trade.review ? (
                                                                                    <>
                                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                                        <span>{t('journal.reviewed')}</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <span>{t('journal.review')}</span>
                                                                                )}
                                                                            </button>

                                                                            {/* Delete button */}
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setTradeToDelete(trade);
                                                                                    setShowDeleteModal(true);
                                                                                }}
                                                                                className="p-2 rounded border border-neutral-700 text-gray-500 hover:text-red-500 hover:border-red-500/30 hover:bg-red-900/20 transition-all"
                                                                                title={language === 'zh' ? '删除交易' : 'Delete Trade'}
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}


                                    </div>
                                </div>
                            )}

                            {/* --- 3. AI 行为诊断 (核心卖点) --- */}
                            {
                                activeTab === 'ai_analysis' && (
                                    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
                                        {/* 会员锁定遮罩 */}
                                        {!membership.isPremium && (
                                            <div className="lg:col-span-3 bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-2xl p-12 border border-amber-500/30 relative overflow-hidden text-center">
                                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

                                                {/* Blurred K-line Chart Silhouette */}
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-64 opacity-30 blur-sm pointer-events-none select-none z-0">
                                                    {/* Animation Removed */}
                                                </div>

                                                <Lock className="w-16 h-16 text-amber-500 mb-6 mx-auto relative z-10" />
                                                <h2 className="text-3xl font-black text-white mb-4 relative z-10">{t('ai.locked_title')}</h2>
                                                <p className="text-gray-400 mb-8 text-lg relative z-10">
                                                    {t('ai.locked_desc')}
                                                </p>
                                                <button onClick={() => { setShowPaymentModal(true); setPaymentMethod(null); }} className="relative z-10 bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-4 rounded-xl shadow-xl shadow-amber-500/20 text-lg hover:scale-105 transition-transform inline-flex items-center gap-2">
                                                    <Crown className="w-5 h-5" /> {t('ai.unlock_btn')}
                                                </button>
                                            </div>
                                        )}

                                        {membership.isPremium && (
                                            <div className="lg:col-span-3">
                                                <Suspense fallback={<div className="h-screen flex items-center justify-center text-amber-500">Loading AI Core...</div>}>
                                                    <AIAnalysisDashboard
                                                        trades={trades}
                                                        language={language}
                                                        riskMode={riskMode}
                                                        onRiskModeChange={setRiskMode}
                                                        totalCapital={totalCapital}
                                                    />
                                                </Suspense>
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            {/* --- 4. 每日内参 (Daily Alpha) --- */}
                            {activeTab === 'daily_alpha' && (
                                <div className="mt-6 animate-in fade-in slide-in-from-bottom-4">
                                    <DailyAlphaTab lang={language} />
                                </div>
                            )}

                            {/* --- 5. Quantum Observer Terminal (New Feature) --- */}
                            {activeTab === 'quantum_terminal' && (
                                <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 min-h-screen pb-32">
                                    <TerminalApp
                                        key={effectiveVersion}
                                        lang={language}
                                        user={user}
                                        membership={membership}
                                        onRequireLogin={() => setShowLoginModal(true)}
                                        onUpgrade={() => setShowPaymentModal(true)}
                                        onAutoFill={(data) => fillTradeForm(data)}
                                    />
                                </div>
                            )}
                        </>
                    )
                }
                {/* Fixed Bottom Progress Bar - The Path to Discipline */}
                {/* Fixed Bottom Progress Bar - HIDDEN Only on Quantum Terminal */}
                {/* Fixed Bottom Progress Bar - The Path to Discipline */}
                {/* Fixed Bottom Progress Bar - HIDDEN on Quantum Terminal AND Daily Alpha */}
                {
                    activeTab !== 'quantum_terminal' && activeTab !== 'daily_alpha' && ((user && !explicitLandingView) || (!user && showGuestDashboard)) && (
                        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/95 backdrop-blur-xl border-t border-white/5 pb-2 pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
                            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6">
                                {
                                    (() => {
                                        const count = trades.length;
                                        // 4 Segments Definition
                                        const segments = [
                                            { id: 'phase1', min: 0, max: 20, width: '20%' },
                                            { id: 'phase2', min: 20, max: 50, width: '30%' },
                                            { id: 'phase3', min: 50, max: 80, width: '30%' },
                                            { id: 'phase4', min: 80, max: 100, width: '20%' },
                                        ];

                                        let currentPhaseKey = 'phase1';
                                        if (count > 80) currentPhaseKey = 'phase4';
                                        else if (count > 50) currentPhaseKey = 'phase3';
                                        else if (count > 20) currentPhaseKey = 'phase2';

                                        const currentPhase = t(`home.phases.${currentPhaseKey}`, { returnObjects: true }) || {};
                                        const maturity = Math.min((count / 100) * 100, 100).toFixed(1);

                                        return (
                                            <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4 md:gap-8">

                                                {/* LEFT: Global Title & Subtitle */}
                                                <div className="flex-1 w-full md:w-1/3 min-w-[280px]">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-amber-500 font-bold font-mono text-xs tracking-wider">[{t('home.footer_title')}]</span>
                                                        <div className="h-px bg-white/10 flex-1"></div>
                                                    </div>
                                                    <h3 className="text-sm sm:text-base font-bold text-white mb-1 shadow-black drop-shadow-md">
                                                        {t('home.footer_subtitle')}
                                                    </h3>
                                                </div>

                                                {/* CENTER: Segmented Energy Bar */}
                                                <div className="w-full md:w-1/2 flex flex-col justify-end pb-1 mt-4 md:mt-0">
                                                    {/* Bar Container */}
                                                    <div className="flex items-center gap-1.5 w-full h-3 md:h-4 mb-2 relative">
                                                        {/* Left Static Labels */}
                                                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-600 font-mono -translate-x-full">0</div>

                                                        {segments.map((seg, index) => {
                                                            // Force equal visual width (25%)
                                                            const segmentWidth = '25%';

                                                            let segProgress = 0;
                                                            if (count >= seg.max) segProgress = 100;
                                                            else if (count > seg.min) {
                                                                segProgress = ((count - seg.min) / (seg.max - seg.min)) * 100;
                                                            }

                                                            const isCompleted = count >= seg.max;
                                                            const isActive = count > seg.min && count < seg.max;
                                                            // Special handling for phase label display
                                                            const isCurrent = (count === 0 && index === 0) || (count > seg.min && count <= seg.max);

                                                            const phaseData = t(`home.phases.${seg.id}`, { returnObjects: true });

                                                            return (
                                                                <div
                                                                    key={seg.id}
                                                                    className="relative h-full rounded-sm border border-white/5 group transition-all duration-300 hover:border-amber-500/30"
                                                                    style={{ width: segmentWidth }}
                                                                >
                                                                    {/* Inner Bar (Overflow Hidden) */}
                                                                    <div className="absolute inset-0 overflow-hidden rounded-sm bg-neutral-900/80">
                                                                        {/* Fill */}
                                                                        <div
                                                                            className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${isCompleted ? 'bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-400'}`}
                                                                            style={{ width: `${segProgress}%` }}
                                                                        >
                                                                            {(isActive || isCompleted) && (
                                                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite] -translate-x-full"></div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Unlock Icon / Marker at end */}
                                                                    <div className="absolute right-0 top-0 bottom-0 w-px bg-black/20 pointer-events-none"></div>
                                                                    {isCompleted && (
                                                                        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                                                            <Unlock className="w-2 h-2 text-black/50" />
                                                                        </div>
                                                                    )}

                                                                    {/* Tooltip (Hover) */}
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-[200px] hidden group-hover:block animate-in fade-in slide-in-from-bottom-2 z-50 pointer-events-none">
                                                                        <div className="bg-[#121212] border border-amber-500/30 text-xs p-2.5 rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] relative">
                                                                            <div className="text-amber-500 font-bold mb-0.5 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                                                                <Unlock className="w-3 h-3" /> UNLOCK
                                                                            </div>
                                                                            <div className="text-white/90 font-medium mb-1">{phaseData.unlock?.replace('解锁', '')}</div>
                                                                            <div className="text-[9px] text-gray-500 leading-tight">{phaseData.logic}</div>

                                                                            {/* Arrow */}
                                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#121212] border-r border-b border-amber-500/30 rotate-45"></div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Current Phase Badge (Hanging Below) */}
                                                                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 transition-opacity duration-500 whitespace-nowrap z-20 ${isCurrent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                                                        <span className="text-amber-500 font-bold font-mono text-[10px] sm:text-xs block text-shadow-sm">
                                                                            [{phaseData.range}] {phaseData.title?.split(/[:：]/)[0]}
                                                                        </span>
                                                                        {/* Connecting Line */}
                                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-gradient-to-b from-amber-500 to-transparent opacity-50"></div>
                                                                    </div>

                                                                </div>
                                                            )
                                                        })}

                                                        {/* Right Static Labels */}
                                                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-600 font-mono translate-x-full">100</div>
                                                    </div>
                                                </div>
                                                {/* RIGHT: Metrics */}
                                                <div className="w-full md:w-auto min-w-[120px] text-right hidden sm:block">
                                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">{t('home.maturity_index')}</p>
                                                    <div className="text-2xl font-black bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text text-transparent font-mono flex items-center justify-end gap-2">
                                                        {maturity}%
                                                        <div className="relative group cursor-help flex items-center">
                                                            <span className="text-[10px] text-gray-600 font-normal border border-gray-800 rounded px-1 bg-black/50 group-hover:bg-amber-500/10 group-hover:border-amber-500/30 group-hover:text-amber-500 transition-colors">EV+</span>
                                                            {/* EV+ Definition Tooltip */}
                                                            <div className="absolute bottom-full right-0 mb-2 w-48 hidden group-hover:block animate-in fade-in slide-in-from-bottom-1 z-50">
                                                                <div className="bg-[#121212] border border-amber-500/30 text-xs p-3 rounded-lg shadow-xl text-left">
                                                                    <div className="text-amber-500 font-bold mb-1">{t('home.ev_plus_title')}</div>
                                                                    <p className="text-gray-400 leading-relaxed">
                                                                        {t('home.ev_plus_desc')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        );
                                    })()
                                }
                            </div>
                        </div>
                    )
                }

            </main >


            {/* Payment Modal */}
            {
                showPaymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                        <div className="bg-neutral-900 w-full max-w-2xl rounded-2xl border border-neutral-800 p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Crown className="w-32 h-32 text-amber-500" />
                            </div>

                            <h3 className="text-2xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent mb-2 mt-4">{t('payment.title')}</h3>


                            {!isPaymentSuccess && (
                                <button onClick={() => { setShowPaymentModal(false); setPaymentMethod(null); }} className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white rounded-lg transition-all z-10">
                                    <X className="w-5 h-5" />
                                </button>
                            )}

                            {isPaymentSuccess ? (
                                <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
                                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/20">
                                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">{t('payment.success_title')}</h3>
                                    <p className="text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
                                        {t('payment.success_desc')}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setIsPaymentSuccess(false);
                                            setShowPaymentModal(false);
                                            setPaymentMethod(null);
                                        }}
                                        className="px-10 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all transform hover:scale-105"
                                    >
                                        {t('common.done')}
                                    </button>
                                </div>
                            ) : !paymentMethod ? (
                                <>
                                    {/* Payment Method Selection */}
                                    <div className="space-y-4">
                                        <p className="text-gray-400 text-sm mb-6 text-center">
                                            {language === 'zh' ? '请选择支付方式' : 'Choose Your Payment Method'}
                                        </p>

                                        {/* Stripe Credit Card Option */}
                                        <button
                                            onClick={handleUpgrade}
                                            disabled={isUpgrading}
                                            className="w-full p-6 bg-gradient-to-r from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 border border-neutral-700 hover:border-amber-500/50 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                                        >

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <CreditCard className="w-12 h-12 text-amber-500 group-hover:scale-110 transition-transform" />
                                                    <div className="text-left">
                                                        <div className="text-xl font-black text-white mb-1">
                                                            {language === 'zh' ? '信用卡/借记卡' : 'Credit/Debit Card'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">Visa, Mastercard, Amex</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {isUpgrading ? (
                                                        <div className="w-5 h-5 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-baseline gap-2 justify-end">
                                                                <div className="text-2xl font-black text-amber-500">$39.00</div>
                                                            </div>
                                                            <div className="text-xs text-gray-500">/year</div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </button>

                                        {/* USDT Crypto Option */}
                                        <button
                                            onClick={() => setPaymentMethod('usdt')}
                                            className="w-full p-6 bg-gradient-to-r from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 border border-neutral-700 hover:border-amber-500/50 rounded-xl transition-all group relative overflow-hidden"
                                        >

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <Wallet className="w-12 h-12 text-amber-500 group-hover:scale-110 transition-transform" />
                                                    <div className="text-left">
                                                        <div className="text-xl font-black text-white mb-1">{t('payment.usdt')}</div>
                                                        <div className="text-xs text-gray-500">{t('payment.crypto_payment')}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-baseline gap-2 justify-end">
                                                        <div className="text-2xl font-black text-amber-500">39.00 USDT</div>
                                                    </div>
                                                    <div className="text-xs text-gray-500">/year</div>
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                </>
                            ) : paymentMethod === 'usdt' ? (
                                <>
                                    {/* USDT 手动支付界面 */}
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={() => setPaymentMethod(null)} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white rounded-lg transition-all">
                                            <ArrowRight className="w-4 h-4 rotate-180" /> {language === 'zh' ? '返回选择支付方式' : 'Back to Payment Methods'}
                                        </button>
                                    </div>

                                    <div className="space-y-4">


                                        <div className="p-4 bg-neutral-800 rounded-xl">
                                            <div className="text-xs text-gray-400 mb-2">{t('payment.receiving_address')}</div>

                                            {/* QR Code Section */}
                                            <div className="flex flex-col items-center justify-center mb-4">
                                                <div className="p-2 bg-white rounded-xl mb-2">
                                                    <img
                                                        src={`/assets/payment_qr_${language === 'zh' ? 'zh' : 'en'}.png`}
                                                        alt="Payment QR Code"
                                                        className="w-40 h-40 object-contain"
                                                    />
                                                </div>
                                                <a
                                                    href={`/assets/payment_qr_${language === 'zh' ? 'zh' : 'en'}.png`}
                                                    download={`goldcat_payment_qr_${language === 'zh' ? 'zh' : 'en'}.png`}
                                                    className="text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-1 mt-1 transition-colors"
                                                >
                                                    <div className="w-3 h-3 border border-amber-500 rounded-full flex items-center justify-center">↓</div>
                                                    {language === 'zh' ? '保存二维码图片' : 'Save QR Code'}
                                                </a>
                                            </div>

                                            <div className="flex items-center justify-between bg-black/50 p-3 rounded-lg">
                                                <code className="text-xs font-mono text-white break-all">TKwXfsr8XMWaHKktL3CD3NqH39oU1R461R</code>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText('TKwXfsr8XMWaHKktL3CD3NqH39oU1R461R');
                                                        setToastMessage(t('payment.copied'));
                                                        setShowSuccessToast(true);
                                                    }}
                                                    className="ml-2 text-gray-400 hover:text-white"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-neutral-800 rounded-xl">
                                            <div className="text-xs text-gray-400 mb-2">{t('payment.amount_due')}</div>
                                            <div className="text-3xl font-black text-amber-500">39.00 USDT</div>
                                        </div>

                                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                            <div className="text-sm text-blue-400 mb-2 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                {t('payment.instructions')}
                                            </div>
                                            <ul className="text-xs text-gray-400 space-y-1">
                                                <li>• {t('payment.instruction_1')}</li>
                                                <li>• {t('payment.instruction_2')}</li>
                                                <li className="text-amber-400 font-semibold">• {t('payment.instruction_3')}</li>
                                                <li>• {t('payment.instruction_4')}</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-400 mb-2 block">{t('payment.txid_label')}</label>
                                            <input
                                                type="text"
                                                value={paymentTxId}
                                                onChange={(e) => setPaymentTxId(e.target.value)}
                                                placeholder={t('payment.txid_placeholder')}
                                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none font-mono text-sm"
                                            />
                                        </div>

                                        <button
                                            onClick={async () => {
                                                if (!paymentTxId) {
                                                    setErrorMessage(t('payment.txid_placeholder'));
                                                    setShowErrorToast(true);
                                                    return;
                                                }

                                                try {
                                                    // Create or update order in Supabase
                                                    const orderNum = orderNumber || `ORDER-${Date.now()}`;

                                                    const { error } = await supabase
                                                        .from('orders')
                                                        .insert({
                                                            order_number: orderNum,
                                                            user_id: user.id,
                                                            user_email: user.email,
                                                            amount: 39,
                                                            currency: 'USDT',
                                                            payment_method: 'usdt',
                                                            txid: paymentTxId,
                                                            status: 'paid'
                                                        });

                                                    if (error) {
                                                        console.error('Order creation error:', error);
                                                        setErrorMessage(t('common.error') + ': ' + error.message);
                                                        setShowErrorToast(true);
                                                        return;
                                                    }

                                                    setIsPaymentSuccess(true);
                                                    setPaymentTxId('');
                                                    setOrderNumber('');
                                                } catch (err) {
                                                    console.error('Unexpected error:', err);
                                                    setErrorMessage(t('common.error'));
                                                    setShowErrorToast(true);
                                                }
                                            }}
                                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-lg rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                                        >
                                            {t('payment.submit_review')}
                                        </button>
                                    </div>
                                </>

                            ) : paymentMethod === 'cny' ? (
                                <>
                                    {/* RMB Payment - Xorpay (to be integrated) */}
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={() => setPaymentMethod(null)} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white rounded-lg transition-all">
                                            <ArrowRight className="w-4 h-4 rotate-180" /> {t('payment.back')}
                                        </button>
                                    </div>
                                    <div className="text-center py-8">
                                        <Coins className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                        <h4 className="text-xl font-bold text-white mb-2">{t('payment.cny')}</h4>
                                        <p className="text-gray-400 mb-6">{t('payment.channel_connecting')}</p>
                                        <button
                                            disabled
                                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-neutral-700 text-gray-500 font-black text-lg rounded-xl cursor-not-allowed"
                                        >
                                            <Wallet className="w-5 h-5" />
                                            {t('payment.coming_soon')}
                                        </button>
                                    </div>
                                </>
                            ) : null}



                            <p className="text-center text-[10px] text-gray-600 mt-4 flex items-center justify-center gap-1">
                                <Shield className="w-3 h-3" /> {t('payment.security')}
                            </p>


                        </div>
                    </div>
                )
            }



            {/* 登录弹窗 */}
            {
                showLoginModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                        <div className="bg-neutral-900 w-full max-w-sm rounded-2xl border border-neutral-800 p-8 shadow-2xl relative">
                            <h3 className="text-2xl font-bold text-white mb-6">{isRegisterMode ? t('auth.register_title') : t('auth.login_title')}</h3>
                            <div className="space-y-4">
                                {isRegisterMode && (
                                    <input
                                        type="text" placeholder={t('auth.username')}
                                        value={registerForm.username} onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                                    />
                                )}
                                <input
                                    type="email" placeholder={t('auth.email')}
                                    value={isRegisterMode ? registerForm.email : loginForm.email}
                                    onChange={e => isRegisterMode ? setRegisterForm({ ...registerForm, email: e.target.value }) : setLoginForm({ ...loginForm, email: e.target.value })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                                />
                                <input
                                    type="password" placeholder={t('auth.password')}
                                    value={isRegisterMode ? registerForm.password : loginForm.password}
                                    onChange={e => isRegisterMode ? setRegisterForm({ ...registerForm, password: e.target.value }) : setLoginForm({ ...loginForm, password: e.target.value })}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                                />
                                {isRegisterMode && (
                                    <input
                                        type="password" placeholder={t('auth.confirm_password')}
                                        value={registerForm.confirmPassword} onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                                    />
                                )}

                                <button
                                    onClick={isRegisterMode ? handleRegister : handleLogin}
                                    disabled={isSubmitting}
                                    className={`w-full py-3 font-bold rounded-xl transition-all ${isSubmitting
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-amber-500 hover:bg-amber-400'
                                        } text-black`}
                                >
                                    {isSubmitting
                                        ? (language === 'zh' ? '处理中...' : 'Processing...')
                                        : (isRegisterMode ? t('auth.register_btn') : t('auth.login_btn'))
                                    }
                                </button>

                                <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
                                    <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="text-amber-500 hover:underline">
                                        {isRegisterMode ? t('auth.to_login') : t('auth.to_register')}
                                    </button>
                                    {!isRegisterMode && (
                                        <button onClick={() => {
                                            setShowLoginModal(false);
                                            setShowFeedbackModal(true);
                                            setFeedbackForm({
                                                ...feedbackForm,
                                                type: 'support',
                                                content: t('auth.forgot_password_content') + loginForm.email
                                            });
                                        }} className="text-gray-500 hover:text-gray-300">
                                            {t('auth.forgot_password')}
                                        </button>
                                    )}

                                </div>
                            </div>
                            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-gray-500"><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                )
            }

            {/* 结算弹窗 */}
            {
                showCloseTradeModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1A1D24] w-full max-w-sm rounded-2xl border border-neutral-800 p-6 shadow-2xl">
                            <h3 className="text-lg font-bold text-white mb-6">{t('journal.settle')}</h3>
                            <input
                                type="number"
                                placeholder="0"
                                value={closePnL}
                                onChange={e => setClosePnL(e.target.value)}
                                onFocus={e => e.target.value === '0' && setClosePnL('')}
                                onBlur={e => e.target.value === '' && setClosePnL('0')}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none font-mono mb-4 text-lg text-center"
                                autoFocus
                            />

                            {/* 违反纪律标记 */}
                            <div className="mb-6 p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={violatedDiscipline}
                                        onChange={(e) => setViolatedDiscipline(e.target.checked)}
                                        className="w-5 h-5 rounded border-red-600 text-red-500 focus:ring-red-500 focus:ring-offset-0 bg-red-900/20"
                                    />
                                    <div>
                                        <div className="text-red-400 font-bold text-sm flex items-center gap-2">
                                            <span>⚠️</span>
                                            <span>{t('risk.violation')}</span>
                                        </div>
                                        <div className="text-red-300/60 text-xs mt-1">
                                            {t('risk.violation_desc')}
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCloseTradeModal(false)}
                                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-xl font-bold transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={confirmSettleTrade}
                                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/20"
                                >
                                    {t('common.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 退出登录确认弹窗 */}
            {
                showLogoutModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1A1D24] w-full max-w-sm rounded-2xl border border-neutral-800 p-6 shadow-2xl text-center">
                            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LogOut className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{t('auth.logout_confirm_title')}</h3>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-xl font-bold transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/20"
                                >
                                    {t('auth.logout_confirm_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 复盘弹窗 */}
            {
                showReviewModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1A1D24] w-full max-w-2xl rounded-2xl border border-neutral-800 p-6 shadow-2xl">
                            <h3 className="text-lg font-bold text-white mb-4">{t('journal.review_title')}</h3>
                            <p className="text-xs text-gray-400 mb-3">{t('journal.review_desc')}</p>

                            {/* Review Prompts */}
                            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <p className="text-xs text-amber-400 font-bold mb-2">💡 思考引导：</p>
                                <ul className="space-y-1">
                                    {(t('journal.review_prompts') || []).map((prompt, idx) => (
                                        <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                                            <span className="text-amber-500">•</span>
                                            <span>{prompt}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <textarea
                                value={reviewNotes}
                                onChange={e => setReviewNotes(e.target.value)}
                                className="w-full h-32 bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none mb-6 resize-none"
                                placeholder={t('journal.review_placeholder')}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    disabled={isSaving}
                                    className="flex-1 py-3 rounded-xl bg-neutral-800 text-gray-400 hover:bg-neutral-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('risk.cancel')}
                                </button>
                                <button
                                    onClick={saveReview}
                                    disabled={isSaving}
                                    className="flex-1 py-3 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSaving && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                                    {isSaving ? t('common.loading') : t('form.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Risk Warning Modal */}
            {
                showRiskWarningModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1A1D24] w-full max-w-sm rounded-2xl border border-red-900/50 p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-4 text-red-500">
                                <AlertTriangle className="w-8 h-8" />
                                <h3 className="text-lg font-bold text-white">{t('risk.modal_title')}</h3>
                            </div>
                            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                                {t('risk.low_rr_warning').replace('{rr}', pendingTrade?.rrRatio)}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRiskWarningModal(false)}
                                    className="flex-1 py-2 rounded-lg bg-neutral-800 text-gray-400 hover:bg-neutral-700 font-bold text-sm transition-colors"
                                >
                                    {t('risk.cancel')}
                                </button>
                                <button
                                    onClick={() => {
                                        finalizeTrade(pendingTrade);
                                        setShowRiskWarningModal(false);
                                    }}
                                    className="flex-1 py-2 rounded-lg bg-red-600/20 text-red-500 border border-red-600/50 hover:bg-red-600/30 font-bold text-sm transition-colors"
                                >
                                    {t('risk.confirm_force')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }



            {/* Pattern Management Modal */}
            {
                showPatternModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1A1D24] w-full max-w-sm rounded-2xl border border-neutral-800 p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">{t('form.manage_patterns')}</h3>
                                <button onClick={() => setShowPatternModal(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newPattern}
                                    onChange={e => setNewPattern(e.target.value)}
                                    placeholder="输入新形态名称"
                                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
                                />
                                <button onClick={addPattern} className="bg-amber-500 text-black px-3 py-2 rounded-lg font-bold text-sm hover:bg-amber-400">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {patterns.map(p => (
                                    <div key={p} className="flex justify-between items-center bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                                        <span className="text-sm text-gray-300">{p}</span>
                                        <button onClick={() => removePattern(p)} className="text-gray-500 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-neutral-800">
                                <button
                                    onClick={resetPatterns}
                                    className="w-full py-2 text-xs text-gray-500 hover:text-amber-500 hover:bg-neutral-900 rounded transition-colors flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    {t('form.reset_default')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Settings Modal */}
            {
                showSettingsModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#1A1D24] w-full max-w-sm rounded-2xl border border-neutral-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white">{t('settings.title')}</h3>
                                <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">{t('settings.membership_status')}</label>
                                <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${membership.isPremium ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-800 text-gray-500'}`}>
                                            <Crown className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className={`font-bold ${membership.isPremium ? 'text-amber-500' : 'text-gray-400'}`}>
                                                {membership.isPremium ? 'PRO MEMBER' : t('settings.free')}
                                            </div>
                                            {/* 终身会员，不显示到期时间
                                            {membership.isPremium && (
                                                <div className="text-xs text-gray-500">
                                                    {t('settings.expires_on')}: {membership.expiryDate ? new Date(membership.expiryDate).toLocaleDateString() : '-'}
                                                </div>
                                            )}
                                            */}
                                        </div>
                                    </div>
                                    {!membership.isPremium && (
                                        <button
                                            onClick={() => { setShowSettingsModal(false); setShowPaymentModal(true); setPaymentMethod(null); }}
                                            className="text-xs bg-amber-500 text-black px-3 py-1.5 rounded-lg font-bold hover:bg-amber-400"
                                        >
                                            UPGRADE
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Username Editor */}
                            <div className="mb-6">
                                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">{language === 'zh' ? '用户名' : 'Username'}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editedUsername}
                                        onChange={(e) => setEditedUsername(e.target.value)}
                                        onFocus={() => {
                                            if (!editedUsername) {
                                                setEditedUsername(user?.user_metadata?.username || user?.email?.split('@')[0] || '');
                                            }
                                        }}
                                        placeholder={user?.user_metadata?.username || user?.email?.split('@')[0] || (language === 'zh' ? '输入用户名' : 'Enter username')}
                                        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none text-sm"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!editedUsername.trim()) {
                                                setErrorMessage(language === 'zh' ? '用户名不能为空' : 'Username cannot be empty');
                                                setShowErrorToast(true);
                                                return;
                                            }
                                            try {
                                                const { error } = await supabase.auth.updateUser({
                                                    data: { username: editedUsername.trim() }
                                                });
                                                if (error) throw error;
                                                setToastMessage(language === 'zh' ? '用户名已更新！' : 'Username updated!');
                                                setShowSuccessToast(true);
                                                // Refresh user data
                                                const { data: { user: refreshedUser } } = await supabase.auth.getUser();
                                                if (refreshedUser) {
                                                    setUser(refreshedUser);
                                                }
                                            } catch (error) {
                                                setErrorMessage(error.message);
                                                setShowErrorToast(true);
                                            }
                                        }}
                                        className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-lg font-bold text-sm transition-colors"
                                    >
                                        {language === 'zh' ? '保存' : 'Save'}
                                    </button>
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1">
                                    {language === 'zh' ? '当前：' : 'Current: '}{user?.user_metadata?.username || user?.email?.split('@')[0] || '-'}
                                </div>
                            </div>

                            {/* Membership Benefits (Visible to all, highlighted for Pro) */}
                            <div className="mb-6">
                                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">{t('payment.badge')}</label>
                                <div className="space-y-2">
                                    <div className={`flex items-center gap-2 text-sm ${membership.isPremium ? 'text-white' : 'text-gray-500'}`}>
                                        <CheckCircle2 className={`w-4 h-4 ${membership.isPremium ? 'text-amber-500' : 'text-gray-600'}`} />
                                        <span>{t('payment.ai_analysis')}</span>
                                    </div>
                                    <div className={`flex items-center gap-2 text-sm ${membership.isPremium ? 'text-white' : 'text-gray-500'}`}>
                                        <CheckCircle2 className={`w-4 h-4 ${membership.isPremium ? 'text-amber-500' : 'text-gray-600'}`} />
                                        <span>{t('payment.unlimited')}</span>
                                    </div>
                                    <div className={`flex items-center gap-2 text-sm ${membership.isPremium ? 'text-white' : 'text-gray-500'}`}>
                                        <CheckCircle2 className={`w-4 h-4 ${membership.isPremium ? 'text-amber-500' : 'text-gray-600'}`} />
                                        <span>{t('payment.support')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Fortune Compass Settings (Hidden for now) */}
                            {/*
                            <div className="mb-6">
                                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">{t('settings.birth_date')}</label>
                                <input
                                    type="date"
                                    value={user?.birthDate || ''}
                                    onChange={(e) => setUser({ ...user, birthDate: e.target.value })}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none mb-4"
                                />

                                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">{t('settings.gender')}</label>
                                <div className="flex gap-4">
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="male"
                                            checked={user?.gender === 'male'}
                                            onChange={(e) => setUser({ ...user, gender: e.target.value })}
                                            className="hidden peer"
                                        />
                                        <div className="w-full bg-neutral-900 border border-neutral-700 peer-checked:border-amber-500 peer-checked:bg-amber-500/10 rounded-lg p-3 text-center text-gray-400 peer-checked:text-amber-500 transition-all">
                                            {t('settings.male')}
                                        </div>
                                    </label>
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="female"
                                            checked={user?.gender === 'female'}
                                            onChange={(e) => setUser({ ...user, gender: e.target.value })}
                                            className="hidden peer"
                                        />
                                        <div className="w-full bg-neutral-900 border border-neutral-700 peer-checked:border-amber-500 peer-checked:bg-amber-500/10 rounded-lg p-3 text-center text-gray-400 peer-checked:text-amber-500 transition-all">
                                            {t('settings.female')}
                                        </div>
                                    </label>
                                </div>

                                <p className="text-[10px] text-gray-600 mt-3">
                                    * {t('fortune.personalized')}
                                </p>
                            </div>
                            */}

                            <button
                                onClick={() => {
                                    // Save user settings to localStorage
                                    const storedUsers = JSON.parse(localStorage.getItem('goldcat_users') || '[]');
                                    const updatedUsers = storedUsers.map(u => u.email === user.email ? user : u);
                                    localStorage.setItem('goldcat_users', JSON.stringify(updatedUsers));
                                    localStorage.setItem('goldcat_user', JSON.stringify(user)); // Update current session user

                                    setShowSettingsModal(false);
                                    setShowSuccessToast(true);
                                }}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/20 mb-4"
                            >
                                {t('settings.save')}
                            </button>

                            <div className="border-t border-neutral-800 pt-4">
                                <button
                                    onClick={() => {
                                        setShowSettingsModal(false);
                                        handleLogout();
                                    }}
                                    className="w-full py-3 bg-neutral-800 hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" /> {t('auth.logout_confirm_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 浮动客服按钮 */}
            <button
                onClick={() => {
                    setFeedbackForm({
                        ...feedbackForm,
                        name: user?.user_metadata?.username || '',
                        email: user?.email || user?.user_metadata?.email || ''
                    });
                    setShowFeedbackModal(true);
                }}
                className="fixed bottom-24 right-6 z-50 bg-amber-500 hover:bg-amber-400 text-black p-4 rounded-full shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-110 transition-all group"
            >
                <MessageSquare className="w-6 h-6" />
            </button>

            {/* 反馈弹窗 (Founder Chat Style) */}
            {
                showFeedbackModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-md bg-[#0D0D0D] border border-neutral-800 rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 font-sans">

                            {/* Header */}
                            <div className="flex items-center justify-between p-4 px-6 border-b border-neutral-800 bg-[#121212]">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#121212]"></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">{t('feedback.title')}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                            {t('feedback.status')}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowFeedbackModal(false)}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6 bg-[#0D0D0D]">

                                {/* Founder Message */}
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-1">
                                        <User className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div className="bg-[#1C1C1E] text-gray-300 text-sm p-4 rounded-2xl rounded-tl-none border border-neutral-800 leading-relaxed whitespace-pre-wrap shadow-sm">
                                        {t('feedback.greeting')}
                                    </div>
                                </div>

                                {/* Form */}
                                <div className="space-y-4 pl-11">
                                    {/* Message Input */}
                                    <div>
                                        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 pl-1">
                                            {t('feedback.message_label')}
                                        </label>
                                        <textarea
                                            placeholder={t('feedback.message_placeholder')}
                                            value={feedbackForm.content}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                                            rows={3}
                                            className="w-full bg-[#121212] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-neutral-600 focus:outline-none resize-none transition-colors"
                                        />
                                    </div>

                                    {/* Contact Input */}
                                    <div>
                                        <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 pl-1">
                                            {t('feedback.contact_label')}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={t('feedback.contact_placeholder')}
                                            value={feedbackForm.email}
                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                                            className="w-full bg-[#121212] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-neutral-600 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmitFeedback}
                                        className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center justify-center gap-2 mt-2"
                                    >
                                        {t('feedback.submit_btn')}
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Footer with Privacy and Terms - Static Scrollable */}
            <div className="relative w-full max-w-7xl mx-auto px-4 py-4 md:py-8 mt-auto mb-2 md:mb-6 text-gray-500 text-xs font-mono">
                <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4 border-t border-white/10 pt-4 md:pt-8">
                    {/* Left: Copyright */}
                    <div className="scale-90 md:scale-100">
                        © {new Date().getFullYear()} GoldCat Terminal. {language === 'zh' ? '保留所有权利。' : 'All rights reserved.'}
                    </div>

                    {/* Right: Links */}
                    <div className="flex items-center gap-4 md:gap-6 scale-90 md:scale-100">
                        <button
                            onClick={() => setCurrentPage('privacy')}
                            className="text-gray-500 hover:text-amber-500 transition-colors"
                        >
                            {language === 'zh' ? '隐私政策' : 'Privacy Policy'}
                        </button>
                        <button
                            onClick={() => setCurrentPage('terms')}
                            className="text-gray-500 hover:text-amber-500 transition-colors"
                        >
                            {language === 'zh' ? '服务条款' : 'Terms of Service'}
                        </button>
                        <a
                            href="https://paragraph.com/@goldcat.trade/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-amber-500 transition-colors"
                        >
                            {language === 'zh' ? '博客' : 'Blog'}
                        </a>
                        <button
                            onClick={() => setShowDisclaimer(!showDisclaimer)}
                            className="text-gray-500 hover:text-amber-500 transition-colors flex items-center gap-1"
                        >
                            <AlertTriangle className="w-3 h-3" />
                            {language === 'zh' ? '风险提示' : 'Risk Disclaimer'}
                        </button>
                    </div>
                </div>

                {showDisclaimer && (
                    <div className="max-w-3xl mx-auto mt-2 px-4 py-2 bg-amber-900/10 border border-amber-500/20 rounded text-xs text-gray-300">
                        {language === 'zh' ? (
                            <span><strong className="text-amber-400">风险提示：</strong>GoldCat 仅提供交易记录工具，不构成任何投资建议。交易有风险，投资需谨慎。</span>
                        ) : (
                            <span><strong className="text-amber-400">Risk Disclaimer:</strong> GoldCat is a trading journal tool only and does not constitute investment advice. Trading involves risk. Please invest responsibly.</span>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl scale-in-95 animate-in zoom-in-95 duration-200">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {language === 'zh' ? '确认删除交易？' : 'Delete Trade?'}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {language === 'zh'
                                        ? '此操作将永久删除该交易记录，无法恢复。'
                                        : 'This action will permanently delete this trade record. It cannot be undone.'}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setTradeToDelete(null);
                                    }}
                                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-colors"
                                >
                                    {language === 'zh' ? '取消' : 'Cancel'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (tradeToDelete) {
                                            removeTrade(tradeToDelete.id);
                                            setShowDeleteModal(false);
                                            setTradeToDelete(null);
                                        }
                                    }}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-900/20"
                                >
                                    {language === 'zh' ? '确认删除' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Page Routing: Privacy Policy and Terms of Service Pages */}
            {
                currentPage === 'privacy' && (
                    <div className="fixed inset-0 z-[10000] bg-black overflow-y-auto animate-in fade-in duration-200">
                        <PrivacyPolicyPage language={language} onBack={() => setCurrentPage('main')} />
                    </div>
                )
            }
            {
                currentPage === 'terms' && (
                    <div className="fixed inset-0 z-[10000] bg-black overflow-y-auto animate-in fade-in duration-200">
                        <TermsOfServicePage language={language} onBack={() => setCurrentPage('main')} />
                    </div>
                )
            }


            {/* 成功提示 Toast (Moved to end to ensure z-index priority) */}
            {
                showSuccessToast && (
                    <div className="fixed bottom-8 right-8 z-[10000] animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-black/60 backdrop-blur-xl border border-white/10 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 ring-1 ring-white/5">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <div className="font-bold text-sm tracking-wide">{toastMessage || t('common.success')}</div>
                            </div>
                            <button onClick={() => setShowSuccessToast(false)} className="ml-2 text-gray-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )
            }

            {/* 错误提示 Toast (Moved to end) */}
            {
                showErrorToast && (
                    <div className="fixed bottom-8 right-8 z-[10000] animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-black/60 backdrop-blur-xl border border-red-500/30 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 ring-1 ring-red-500/20">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <div className="font-bold text-sm tracking-wide text-red-400">
                                    {t('common.error') === 'common.error' ? (language === 'zh' ? '发生错误' : 'Error') : t('common.error')}
                                </div>
                                <div className="text-xs text-gray-400">{errorMessage}</div>
                            </div>
                            <button onClick={() => setShowErrorToast(false)} className="ml-2 text-gray-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )
            }

            {/* --- GLOBAL DEBUG OVERLAY --- */}
            {/* <MobileDebugOverlay />  HIDDEN AS REQUESTED */}
            <div className="fixed top-2 left-2 z-[9999] opacity-30 text-[10px] text-gray-500 font-mono pointer-events-none select-none">
                v1.2.39
            </div>

        </div >
    );
}

export default GoldCatApp;

