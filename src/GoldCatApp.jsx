import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { getCheckoutUrl, CREEM_CONFIG } from './creemConfig';
import PrivacyPolicyPage from './PrivacyPolicyPage';
import TermsOfServicePage from './TermsOfServicePage';
import ParticleLogo from './ParticleLogo';
import {
    TrendingUp, TrendingDown, DollarSign, Package, AlertCircle, BarChart3, Target,
    Award, Plus, X, Crown, Calendar, CreditCard, Wallet, User, LogOut, Trash2,
    Infinity, Activity, Zap, FileText, Brain, Sparkles, CheckCircle2, AlertTriangle,
    Lightbulb, Shield, Globe, MessageSquare, Cpu, ChevronRight, Lock, Settings,
    PieChart, BarChart, ArrowRight, Compass, Edit3, ShieldCheck, Coins, Copy,
    PlusCircle, Check, RotateCcw, Info, Loader2
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, ReferenceLine, Bar, Cell, Pie
} from 'recharts';
import { translations } from './translations';

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

function GoldCatApp() {
    // --- 2. 状态管理 (带持久化) ---

    // 用户系统
    // 用户系统
    const [user, setUser] = useState(null);
    const [membership, setMembership] = useState({ isPremium: false, expiryDate: null, maxTrades: 20 });
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState({
        name: '',
        email: '',
        type: 'suggestion',
        content: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState('main'); // 'main' | 'privacy' | 'terms'
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    // 多语言支持
    const [language, setLanguage] = useState(() => {
        // 1. 优先使用用户手动选择的语言
        const saved = localStorage.getItem('goldcat_language');
        if (saved) return saved;

        // 2. 默认英语（不再根据浏览器语言自动判断）
        return 'en';
    });

    // 监听语言变化并保存
    useEffect(() => {
        localStorage.setItem('goldcat_language', language);
        setPatterns(getInitialPatterns(language)); // 更新 patterns
    }, [language]);

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
    const [isEditingCapital, setIsEditingCapital] = useState(false);

    // 表单状态
    const [activeTab, setActiveTab] = useState('new_trade'); // 默认进入录入界面，强调纪律
    const [formData, setFormData] = useState({
        tradeType: 'buy',
        symbol: '',
        margin: '',
        leverage: '10',
        entryPrice: '',
        stopLoss: '',
        takeProfit: '',
        pattern: getInitialPatterns('en')[0],
        timeframe: '4h',
        notes: ''
    });

    // 风控分析状态
    const [riskAnalysis, setRiskAnalysis] = useState({
        rrRatio: 0,
        positionSize: 0,
        riskPercent: 0,
        accountRiskPercent: 0,
        riskAmount: 0,
        valid: false
    });

    const [validationErrors, setValidationErrors] = useState({ stopLoss: '', takeProfit: '' });
    const [checklist, setChecklist] = useState({ trend: false, close: false, structure: false });
    const [isShaking, setIsShaking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission
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

            // 1. Load Capital from Local (Immediate)
            const savedCapitalStr = localStorage.getItem(`goldcat_total_capital_${userKey}`);
            const savedCapital = parseFloat(savedCapitalStr) || 0;
            console.log('[Debug] Loading capital immediately:', { key: `goldcat_total_capital_${userKey}`, val: savedCapitalStr, parsed: savedCapital });
            setTotalCapital(savedCapital);

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

                if (!tradesError && dbTrades) {
                    // 转换数据库格式到前端格式
                    const formattedTrades = dbTrades.map(t => {
                        const riskData = t.risk_analysis || {};
                        return {
                            id: t.id,
                            date: t.date,
                            timestamp: t.timestamp,
                            symbol: t.symbol,
                            direction: t.direction,
                            tradeType: t.direction === 'long' ? 'buy' : 'sell', // Fix: Map direction back to tradeType for UI
                            entryPrice: t.entry_price.toString(),
                            stopLoss: t.stop_loss?.toString() || '',
                            takeProfit: t.take_profit?.toString() || '',
                            margin: t.margin.toString(),
                            leverage: t.leverage.toString(),
                            timeframe: t.timeframe,
                            pattern: t.pattern || '',
                            status: t.status,
                            profitLoss: t.profit_loss || 0,
                            violatedDiscipline: t.violated_discipline || false,
                            notes: t.notes || '',
                            review: t.review || '',
                            rrRatio: riskData.rrRatio,
                            positionSize: riskData.positionSize,
                            riskPercent: riskData.riskPercent,
                            accountRiskPercent: riskData.accountRiskPercent,
                            riskAmount: riskData.riskAmount,
                            valid: riskData.valid
                        };
                    });
                    setTrades(formattedTrades);

                    // 数据迁移：如果数据库为空但 localStorage 有数据，迁移过去
                    if (formattedTrades.length === 0) {
                        const localTrades = JSON.parse(localStorage.getItem(`goldcat_trades_${userKey}`)) || [];
                        if (localTrades.length > 0) {
                            console.log('Migrating', localTrades.length, 'trades from localStorage to database...');
                            for (const trade of localTrades) {
                                // Fix: Ensure direction is present (map from tradeType if missing)
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
                            }
                            // Reload after migration
                            const { data: reloadedTrades } = await supabase
                                .from('trades')
                                .select('*')
                                .eq('user_id', user.id)
                                .order('timestamp', { ascending: false });

                            if (reloadedTrades) {
                                const reloadedFormatted = reloadedTrades.map(t => {
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
                                        violatedDiscipline: t.violated_discipline || false,
                                        notes: t.notes || '',
                                        review: t.review || '',
                                        rrRatio: riskData.rrRatio,
                                        positionSize: riskData.positionSize,
                                        riskPercent: riskData.riskPercent,
                                        accountRiskPercent: riskData.accountRiskPercent,
                                        riskAmount: riskData.riskAmount,
                                        valid: riskData.valid
                                    };
                                });
                                setTrades(reloadedFormatted);
                            }
                            console.log('Migration complete!');
                        }
                    }
                } else {
                    console.error('Error loading trades:', tradesError);
                    // Fallback to localStorage
                    const localTrades = JSON.parse(localStorage.getItem(`goldcat_trades_${userKey}`)) || [];
                    setTrades(localTrades);
                }
            } catch (err) {
                console.error('Unexpected error loading trades:', err);
                const localTrades = JSON.parse(localStorage.getItem(`goldcat_trades_${userKey}`)) || [];
                setTrades(localTrades);
            }

            // 4. Load Membership from Supabase DB
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
                } else {
                    setMembership({ isPremium: false, expiryDate: null, maxTrades: 20 });
                }
            } catch (err) {
                console.error('Error loading profile:', err);
                const savedMembership = JSON.parse(localStorage.getItem(`goldcat_membership_${userKey}`)) || { isPremium: false, expiryDate: null, maxTrades: 20 };
                setMembership(savedMembership);
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
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);




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

    useEffect(() => {
        if (user && user.email && isDataLoaded) {
            localStorage.setItem(`goldcat_total_capital_${user.email}`, totalCapital);
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
                const response = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'
                );

                if (!response.ok) {
                    if (response.status === 429) {
                        console.warn('CoinGecko rate limit reached, using cached/mock data');
                        return; // Silent fail on 429
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.bitcoin) {
                    setBtcMarket({
                        price: data.bitcoin.usd,
                        change24h: data.bitcoin.usd_24h_change || 0,
                        loading: false
                    });
                    localStorage.setItem('last_btc_fetch', now.toString());
                }
            } catch (error) {
                // Silent error logging to avoid console red spam
                console.log('Using mock BTC data due to fetch error:', error.message);
                // 失败时使用模拟数据，不显示红色错误
                setBtcMarket(prev => ({ ...prev, loading: false }));
            }
        };

        // 立即获取一次
        fetchBTCPrice();

        // 每30秒更新一次
        const interval = setInterval(fetchBTCPrice, 30000);

        return () => clearInterval(interval);
    }, []);

    // --- 3. 核心业务逻辑 ---

    // 实时风控计算器
    useEffect(() => {
        const entry = parseFloat(formData.entryPrice);
        const stop = parseFloat(formData.stopLoss);
        const take = parseFloat(formData.takeProfit);
        const margin = parseFloat(formData.margin);
        const leverage = parseFloat(formData.leverage);

        console.log('Risk Calc Input:', { entry, stop, take, margin, leverage });

        let rrRatio = 0;
        let positionSize = 0;

        let riskPercent = 0; // Position Risk %
        let accountRiskPercent = 0; // Account Risk %
        let riskAmount = 0; // USDT Risk Amount
        let valid = false;

        if (margin > 0 && leverage > 0) {
            positionSize = margin * leverage;
        }

        // 计算风险 (Entry + SL)
        if (entry > 0 && stop > 0) {
            const risk = Math.abs(entry - stop);
            if (risk > 0) {

                riskPercent = ((risk / entry) * leverage * 100).toFixed(2);
                // Calculate absolute risk amount in USDT
                // Position Size = Margin * Leverage
                // Risk Amount = (Risk Price Diff / Entry Price) * Position Size
                riskAmount = (risk / entry) * positionSize;
                if (totalCapital > 0) {
                    const rawPercent = (riskAmount / totalCapital) * 100;
                    accountRiskPercent = parseFloat(rawPercent.toFixed(2));
                    console.log('Risk Update:', { totalCapital, riskAmount, accountRiskPercent });
                }
            }
        }

        // 计算盈亏比 (Entry + SL + TP) - 严格校验方向
        let errors = { stopLoss: '', takeProfit: '' };
        if (entry > 0 && stop > 0 && take > 0) {
            const isLong = formData.tradeType === 'buy';
            let risk = 0;
            let reward = 0;
            let isValidLogic = false;

            if (isLong) {
                // 做多: SL < Entry < TP
                if (stop >= entry) errors.stopLoss = t('validation.long_sl');
                if (take <= entry) errors.takeProfit = t('validation.long_tp');

                if (stop < entry && take > entry) {
                    risk = entry - stop;
                    reward = take - entry;
                    isValidLogic = true;
                }
            } else {
                // 做空: TP < Entry < SL
                if (stop <= entry) errors.stopLoss = t('validation.short_sl');
                if (take >= entry) errors.takeProfit = t('validation.short_tp');

                if (stop > entry && take < entry) {
                    risk = stop - entry;
                    reward = entry - take;
                    isValidLogic = true;
                }
            }

            if (isValidLogic && risk > 0) {
                rrRatio = (reward / risk).toFixed(2);
                valid = true;
            }
        }
        setValidationErrors(errors);



        setRiskAnalysis({ rrRatio, positionSize, riskPercent, accountRiskPercent, riskAmount, valid });
    }, [formData, totalCapital]);

    const handleInputChange = (field, value) => {
        // Special handling for number fields to strip non-numeric chars (fixes Google Translate artifacts)
        if (['margin', 'leverage', 'entryPrice', 'stopLoss', 'takeProfit'].includes(field)) {
            // Allow only numbers and one decimal point
            const sanitized = value.replace(/[^\d.]/g, '');
            // Prevent multiple decimal points
            const parts = sanitized.split('.');
            const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
            setFormData(prev => ({ ...prev, [field]: finalValue }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const finalizeTrade = async (trade) => {
        try {
            // 获取最新用户信息，确保 ID 匹配
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !currentUser) {
                console.error('Auth error:', authError);
                setErrorMessage('您的登录会话已过期，请重新登录后再试。');
                setShowErrorToast(true);
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
                    notes: trade.notes,
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
                setTimeout(() => setShowErrorToast(false), 3000);
                return;
            }

            // 2. 更新本地状态
            setTrades([trade, ...trades]);
            setToastMessage(t('common.success'));
            setShowSuccessToast(true);

            // 重置表单 but keep some preferences
            setFormData(prev => ({
                ...prev,
                symbol: '', entryPrice: '', stopLoss: '', takeProfit: '', notes: '', margin: ''
            }));
            setChecklist({ trend: false, close: false, structure: false });
        } catch (err) {
            console.error('Unexpected error saving trade:', err);
            setErrorMessage('保存交易记录失败: ' + err.message);
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
        }
    };
    const handleSubmitTrade = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        console.log('handleSubmitTrade called');

        // 1. 权限检查
        if (!membership.isPremium && trades.length >= membership.maxTrades) {
            setShowPaymentModal(true);
            setPaymentMethod(null);
            setIsSubmitting(false);
            return;
        }

        // 2. 必填检查
        if (!formData.symbol || !formData.entryPrice || !formData.margin) {
            alert("【交易纪律】请完整填写交易要素，不可遗漏。");
            setIsSubmitting(false);
            return;
        }


        const newTrade = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            ...formData,
            direction: formData.tradeType === 'buy' ? 'long' : 'short', // 显式映射 tradeType 到 direction
            ...riskAnalysis,
            status: 'open', // open, win, loss
            profitLoss: 0 // 结单后更新
        };

        // 3. 盈亏比检查（软性提醒）
        if (riskAnalysis.valid && riskAnalysis.rrRatio < 1.5) {
            setPendingTrade(newTrade);
            setShowRiskWarningModal(true);
            setIsSubmitting(false);
            return;
        }

        await finalizeTrade(newTrade);
        setIsSubmitting(false);
    };

    // Upgrade membership - Redirect to Creem payment page (using Checkout Session API)
    const handleUpgrade = async () => {
        if (isUpgrading) return;
        setIsUpgrading(true);

        try {
            const config = CREEM_CONFIG[CREEM_CONFIG.CURRENT_ENV];
            const productId = config.PRODUCT_ID;

            // Call Supabase Edge Function to create Checkout Session
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    productId,
                    email: user?.email,
                    successUrl: window.location.origin // Automatically get current domain
                }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            if (data?.checkout_url) {
                console.log('Redirecting to:', data.checkout_url);
                window.open(data.checkout_url, '_blank');
            } else {
                throw new Error('No checkout URL returned');
            }

        } catch (err) {
            console.error('Upgrade failed:', err);
            alert('Failed to initiate payment: ' + err.message);
        } finally {
            setIsUpgrading(false);
        }
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
    // 注册逻辑 -> Supabase Register
    const handleRegister = async () => {
        if (!registerForm.email || !registerForm.password) {
            setErrorMessage(t('auth.fill_all_fields'));
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(registerForm.email)) {
            setErrorMessage(language === 'zh' ? '请输入有效的邮箱地址（例如：user@example.com）' : 'Please enter a valid email address (e.g., user@example.com)');
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            return;
        }

        if (registerForm.password !== registerForm.confirmPassword) {
            setErrorMessage(t('auth.password_mismatch'));
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email: registerForm.email,
            password: registerForm.password,
            options: {
                data: {
                    username: registerForm.username,
                },
            },
        });

        if (error) {
            setErrorMessage(error.message);
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
        } else {
            // Check if email confirmation is required (Supabase default)
            if (data?.user && !data.session) {
                alert('注册成功！请查收邮件并点击确认链接完成注册。');
            } else {
                setShowLoginModal(false);
                setShowSuccessToast(true);
            }
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
            // 获取最新用户信息
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !currentUser) throw new Error('Auth session expired');

            // 1. 更新数据库
            const { error } = await supabase
                .from('trades')
                .update({
                    status: 'closed',
                    profit_loss: pnlValue,
                    violated_discipline: violatedDiscipline
                })
                .eq('id', selectedTradeId)
                .eq('user_id', currentUser.id);

            if (error) {
                console.error('Failed to update trade in database:', error);
                alert('结算失败，请重试');
                return;
            }

            // 2. 更新本地状态
            setTrades(trades.map(t =>
                t.id === selectedTradeId
                    ? { ...t, status: 'closed', profitLoss: pnlValue, violatedDiscipline }
                    : t
            ));

            // 更新总资金
            setTotalCapital(prev => prev + pnlValue);

            setShowCloseTradeModal(false);
            setSelectedTradeId(null);
            setShowSuccessToast(true);
        } catch (err) {
            console.error('Unexpected error settling trade:', err);
            setErrorMessage('结算失败: ' + err.message);
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
        }
    };
    // 复盘交易
    const handleReviewTrade = (trade) => {
        setSelectedTradeId(trade.id);
        setReviewNotes(trade.review || '');
        setShowReviewModal(true);
    };

    const saveReview = async () => {
        if (isSaving) return;
        setIsSaving(true);
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
        } catch (err) {
            console.error('Unexpected error saving review:', err);

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

    // 反馈提交
    const handleSubmitFeedback = async () => {
        // 验证必填项
        if (!feedbackForm.email) {
            setErrorMessage(t('feedback.email_required'));
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            return;
        }
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

    // Trading Pair Risk Detection
    const tradingPairRisk = useMemo(() => {
        if (!formData.symbol) return null;

        const pair = formData.symbol;
        const pairTrades = trades.filter(t => t.symbol === pair && t.status === 'closed');

        // Check 1: Same-day losses
        const today = new Date().toDateString();
        const todayLosses = pairTrades.filter(t => {
            const tradeDate = new Date(t.createdAt || t.timestamp).toDateString();
            return tradeDate === today && (t.profitLoss || 0) < 0;
        }).length;

        // Check 2: Historical loss rate
        const totalTrades = pairTrades.length;
        const losses = pairTrades.filter(t => (t.profitLoss || 0) < 0).length;
        const lossRate = totalTrades > 0 ? (losses / totalTrades) : 0;

        return {
            todayLosses,
            totalTrades,
            lossRate,
            showDailyWarning: todayLosses >= 2,
            showHistoricalWarning: totalTrades >= 5 && lossRate > 0.8
        };
    }, [formData.symbol, trades]);


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

    return (
        <div className="fixed inset-0 bg-black text-gray-200 font-sans selection:bg-amber-500/30 notranslate overflow-auto flex flex-col min-h-screen" translate="no">

            {/* 顶部导航 */}
            <nav className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50 shadow-xl">
                <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src="/goldcat_logo_transparent.png?v=2" alt="GoldCat Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-white tracking-tighter leading-none">
                                {t('app_title')} <span className="text-amber-500 text-[10px] align-top">v4</span>
                            </h1>

                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3">
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
            </nav>


            {/* Fortune Compass Widget - Moved below per user request */}
            {/*
            {
                user && activeTab === 'new_trade' && (
                    <div className="max-w-[1920px] mx-auto px-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
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

            <main className="max-w-[1920px] mx-auto px-4 py-6">

                {/* 登录引导 */}
                {/* 登录引导 (Landing Page Redesign) */}
                {!user && (
                    <div className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-black">
                        {/* Custom Animations */}
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

                            {/* Particle Logo Effect */}
                            <div className="absolute inset-0 z-[5] opacity-60">
                                <ParticleLogo />
                            </div>
                        </div>

                        <div className="relative z-10 max-w-5xl mx-auto animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-8 py-20">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-bold mb-8 tracking-wider uppercase backdrop-blur-md shadow-lg">
                                <Sparkles className="w-3 h-3 animate-pulse" /> {t('app_title')} v4.0
                            </div>

                            <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tight leading-tight drop-shadow-2xl">
                                {t('home.title')}
                            </h1>

                            <p className="text-gray-300 text-lg md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                                {t('home.desc_1')} {t('home.desc_2')}
                            </p>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-20">
                                <button
                                    onClick={() => {
                                        setIsRegisterMode(true);
                                        setShowLoginModal(true);
                                    }}
                                    className="group relative w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-black font-black text-xl px-10 py-5 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-3 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <span className="relative flex items-center gap-2">{t('home.start_btn')} <ChevronRight className="w-6 h-6" /></span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsRegisterMode(false);
                                        setShowLoginModal(true);
                                    }}
                                    className="w-full md:w-auto bg-white/5 hover:bg-white/10 text-white font-bold text-xl px-10 py-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
                                >
                                    {t('auth.login_btn')}
                                </button>
                            </div>

                            {/* Feature Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                <div className="bg-black/40 backdrop-blur-md border border-white/5 p-8 rounded-3xl hover:border-amber-500/50 hover:bg-black/60 transition-all group hover:-translate-y-1 duration-300">
                                    <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.1)] border border-amber-500/20">
                                        <Edit3 className="w-7 h-7 text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">{t('home.feature_manual_title')}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{t('home.feature_manual_desc')}</p>
                                </div>
                                <div className="bg-black/40 backdrop-blur-md border border-white/5 p-8 rounded-3xl hover:border-blue-500/50 hover:bg-black/60 transition-all group hover:-translate-y-1 duration-300">
                                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.1)] border border-blue-500/20">
                                        <ShieldCheck className="w-7 h-7 text-blue-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">{t('home.feature_discipline_title')}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{t('home.feature_discipline_desc')}</p>
                                </div>
                                <div className="bg-black/40 backdrop-blur-md border border-white/5 p-8 rounded-3xl hover:border-yellow-500/50 hover:bg-black/60 transition-all group hover:-translate-y-1 duration-300">
                                    <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(234,179,8,0.1)] border border-yellow-500/20">
                                        <Brain className="w-7 h-7 text-yellow-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">{t('home.feature_ai_title')}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{t('home.feature_ai_desc')}</p>
                                </div>
                            </div>

                            {/* --- Pricing Section (Added for Compliance) --- */}
                            <div className="mt-32 mb-20 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                                <div className="text-center mb-16">
                                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">{t('pricing.title')}</h2>
                                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                                        {t('pricing.subtitle')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto relative group-hover:gap-12 transition-all duration-500">
                                    {/* Free Plan */}
                                    <div className="relative bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all hover:-translate-y-2 duration-300 flex flex-col text-left items-start">
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
                                                setIsRegisterMode(true);
                                                setShowLoginModal(true);
                                            }}
                                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all"
                                        >
                                            {t('pricing.start_free')}
                                        </button>
                                    </div>

                                    {/* Lifetime Plan */}
                                    <div className="relative bg-black/80 backdrop-blur-md border border-amber-500/30 rounded-3xl p-8 hover:border-amber-500 transition-all hover:-translate-y-2 duration-300 shadow-[0_0_50px_rgba(245,158,11,0.1)] flex flex-col scale-105 z-10 text-left items-start">
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
                                            <Crown className="w-3 h-3" /> {t('pricing.pro_badge')}
                                        </div>
                                        <div className="mb-8 w-full">
                                            <h3 className="text-xl font-bold text-amber-500 mb-2 flex items-center gap-2">
                                                {t('pricing.pro_title')}
                                            </h3>
                                            <div className="flex items-baseline gap-1 mb-1">
                                                <span className="text-5xl font-black text-white">{t('pricing.pro_price')}</span>
                                            </div>
                                            <p className="text-amber-500/80 text-xs font-bold uppercase tracking-wide mb-3 text-left">{t('pricing.pro_type')}</p>
                                            <p className="text-gray-400 text-sm">{t('pricing.pro_desc')}</p>
                                        </div>
                                        <div className="border-t border-white/10 my-8 w-full"></div>
                                        <ul className="space-y-4 mb-8 flex-1 w-full">
                                            {Array.isArray(t('pricing.pro_features')) && t('pricing.pro_features').map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3 text-white">
                                                    <div className="bg-amber-500/20 rounded-full p-0.5">
                                                        <Check className="w-4 h-4 text-amber-500 shrink-0" />
                                                    </div>
                                                    <span className="text-sm font-medium">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => {
                                                setIsRegisterMode(true);
                                                setShowLoginModal(true);
                                            }}
                                            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transform hover:scale-[1.02]"
                                        >
                                            {t('pricing.get_pro')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {user && (
                    <>
                        {/* 功能 Tab */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {[
                                { id: 'new_trade', label: t('nav.new_trade'), icon: Plus },
                                { id: 'journal', label: t('nav.journal'), icon: FileText },
                                { id: 'ai_analysis', label: t('nav.ai_analysis'), icon: Brain },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all
                                ${activeTab === tab.id
                                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                            : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700 hover:text-white border border-neutral-700'}
                            `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* --- 1. 录入交易 (核心) --- */}
                        {activeTab === 'new_trade' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                                {/* 左侧：录入表单 */}
                                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                                    <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
                                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                                            <Target className="w-5 h-5 text-amber-500" />
                                            {t('form.title')}
                                        </h2>
                                        <span className="text-xs bg-neutral-800 text-gray-400 px-2 py-1 rounded">
                                            {t('form.today_trade_count', { count: trades.filter(t => t.date === new Date().toLocaleDateString()).length + 1 })}
                                        </span>
                                    </div>

                                    <div className="space-y-6">
                                        {/* 第一行：基础信息 */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="col-span-2 md:col-span-1">
                                                <label className="block text-xs text-gray-500 mb-1.5">{t('form.direction')}</label>
                                                <div className="flex bg-neutral-800 rounded-lg p-1">
                                                    <button
                                                        onClick={() => handleInputChange('tradeType', 'buy')}
                                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formData.tradeType === 'buy' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                    >{t('form.long')}</button>
                                                    <button
                                                        onClick={() => handleInputChange('tradeType', 'sell')}
                                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formData.tradeType === 'sell' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                    >{t('form.short')}</button>
                                                </div>
                                            </div>
                                            <div className="col-span-2 md:col-span-1">
                                                <label className="block text-xs text-gray-500 mb-1.5">{t('form.symbol')}</label>
                                                <input
                                                    type="text" placeholder="BTC/USDT" value={formData.symbol}
                                                    onChange={e => handleInputChange('symbol', e.target.value.toUpperCase())}
                                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none font-mono uppercase"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-xs text-gray-500 mb-1.5">{t('form.timeframe')}</label>
                                                <select
                                                    value={formData.timeframe}
                                                    onChange={e => handleInputChange('timeframe', e.target.value)}
                                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none appearance-none"
                                                >
                                                    {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-1">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <label className="block text-xs text-gray-500">{t('form.pattern')}</label>
                                                    <button onClick={() => setShowPatternModal(true)} className="text-[10px] text-amber-500 hover:underline flex items-center gap-1">
                                                        <Settings className="w-3 h-3" /> {t('form.manage')}
                                                    </button>
                                                </div>
                                                <select
                                                    value={formData.pattern}
                                                    onChange={e => handleInputChange('pattern', e.target.value)}
                                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none appearance-none"
                                                >
                                                    {patterns.map(p => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Trading Pair Risk Warnings */}
                                        {tradingPairRisk?.showDailyWarning && (
                                            <div className="p-2.5 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                                                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                <div className="text-xs text-red-400 leading-relaxed">
                                                    <span className="font-bold">{t('risk.daily_loss_warning')}</span>
                                                    <span className="text-red-300/80 block mt-0.5">{t('risk.daily_loss_detail', { count: tradingPairRisk.todayLosses })}</span>
                                                </div>
                                            </div>
                                        )}

                                        {tradingPairRisk?.showHistoricalWarning && (
                                            <div className="p-2.5 bg-orange-900/20 border border-orange-500/50 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                                                <TrendingDown className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                                <div className="text-xs text-orange-400 leading-relaxed">
                                                    <span className="font-bold">{t('risk.high_loss_rate_warning')}</span>
                                                    <span className="text-orange-300/80 block mt-0.5">{t('risk.high_loss_rate_detail', { rate: (tradingPairRisk.lossRate * 100).toFixed(0), total: tradingPairRisk.totalTrades })}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* 第二行：资金管理 */}
                                        <div className="p-4 bg-neutral-800/30 border border-neutral-800 rounded-xl">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1.5 notranslate">{t('form.margin')}</label>
                                                    <input
                                                        type="number" placeholder="1000" value={formData.margin}
                                                        onChange={e => handleInputChange('margin', e.target.value)}
                                                        step="any"
                                                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none font-mono notranslate"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1.5">{t('form.leverage')}</label>
                                                    <input
                                                        type="number" placeholder="10" value={formData.leverage}
                                                        onChange={e => handleInputChange('leverage', e.target.value)}
                                                        step="any"
                                                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none font-mono notranslate"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 第三行：点位执行 */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1.5 font-bold text-amber-500">{t('form.entry_price')}</label>
                                                <input
                                                    type="number" placeholder="0.00" value={formData.entryPrice}
                                                    onChange={e => handleInputChange('entryPrice', e.target.value)}
                                                    step="any"
                                                    className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none font-mono font-bold notranslate"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1.5 text-red-400">{t('form.stop_loss')}</label>
                                                <input
                                                    type="number" placeholder="0.00" value={formData.stopLoss}
                                                    onChange={e => handleInputChange('stopLoss', e.target.value)}
                                                    step="any"
                                                    className={`w-full bg-neutral-800 border ${validationErrors.stopLoss ? 'border-red-500' : 'border-neutral-700'} rounded-lg px-3 py-2.5 text-white focus:border-red-500 focus:outline-none font-mono notranslate`}
                                                />
                                                {validationErrors.stopLoss && <div className="text-[10px] text-red-500 mt-1">{validationErrors.stopLoss}</div>}
                                                {formData.entryPrice && formData.stopLoss && formData.margin && (
                                                    <div className="text-[10px] text-gray-500 mt-1">
                                                        预计亏损: <span className="text-red-500">
                                                            ${Math.abs(((parseFloat(formData.stopLoss) - parseFloat(formData.entryPrice)) / parseFloat(formData.entryPrice) * parseFloat(formData.margin) * parseFloat(formData.leverage))).toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1.5 text-green-400">{t('form.take_profit')}</label>
                                                <input
                                                    type="number" placeholder="0.00" value={formData.takeProfit}
                                                    onChange={e => handleInputChange('takeProfit', e.target.value)}
                                                    step="any"
                                                    className={`w-full bg-neutral-800 border ${validationErrors.takeProfit ? 'border-red-500' : 'border-neutral-700'} rounded-lg px-3 py-2.5 text-white focus:border-green-500 focus:outline-none font-mono notranslate`}
                                                />
                                                {validationErrors.takeProfit && <div className="text-[10px] text-red-500 mt-1">{validationErrors.takeProfit}</div>}
                                                {formData.entryPrice && formData.takeProfit && formData.margin && (
                                                    <div className="text-[10px] text-gray-500 mt-1">
                                                        预计盈利: <span className="text-green-500">
                                                            ${Math.abs(((parseFloat(formData.takeProfit) - parseFloat(formData.entryPrice)) / parseFloat(formData.entryPrice) * parseFloat(formData.margin) * parseFloat(formData.leverage))).toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 提交按钮区域 */}
                                        <div className="pt-4">
                                            {!membership.isPremium && trades.length >= membership.maxTrades ? (
                                                <button disabled className="w-full py-4 bg-neutral-800 border border-neutral-700 text-gray-500 font-bold rounded-xl cursor-not-allowed flex flex-col items-center justify-center gap-1">
                                                    <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> {t('form.quota_full')}</span>
                                                    <span className="text-xs font-normal">{t('form.quota_desc')}</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        if (!riskAnalysis.valid) {
                                                            setIsShaking(true);
                                                            setTimeout(() => setIsShaking(false), 500);
                                                            return;
                                                        }
                                                        handleSubmitTrade();
                                                    }}
                                                    className={`w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-lg ${isShaking ? 'animate-shake' : ''} ${!riskAnalysis.valid ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                                                >
                                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PlusCircle className="w-5 h-5" /> {t('form.submit_btn')}</>}
                                                </button>)}
                                            <p className="text-center text-xs text-gray-600 mt-3">
                                                {t('form.honest_note')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 右侧：实时风控面板 */}
                                <div className="space-y-6">
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-fit">
                                        <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-amber-500" />
                                            {t('risk.title')}
                                        </h3>

                                        {/* Total Capital Management */}
                                        <div className="mb-4 p-3 bg-neutral-800/30 border border-neutral-700 rounded-xl">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-gray-400">{t('risk.total_capital')}</span>
                                                {!isEditingCapital && (
                                                    <button onClick={() => setIsEditingCapital(true)} className="text-amber-500 hover:text-amber-400">
                                                        <Edit3 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            {isEditingCapital ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={totalCapital}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === '' || val === '-') {
                                                                setTotalCapital('');
                                                            } else {
                                                                const parsed = parseFloat(val);
                                                                setTotalCapital(isNaN(parsed) ? 0 : parsed);
                                                            }
                                                        }}
                                                        className="w-full bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-sm text-white font-mono"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => setIsEditingCapital(false)} className="bg-green-600 text-white px-2 py-1 rounded text-xs">OK</button>
                                                </div>
                                            ) : (
                                                <div className="text-xl font-black font-mono text-white tracking-wider">
                                                    ${(totalCapital || 0).toLocaleString()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className={`p-4 rounded-xl border ${riskAnalysis.valid && riskAnalysis.rrRatio >= 1.5 ? 'bg-green-900/20 border-green-900/50' : 'bg-neutral-800 border-neutral-700'}`}>
                                                <div className="text-xs text-gray-500 mb-1">{t('risk.rr_ratio')}</div>
                                                <div className="text-3xl font-black font-mono flex items-end gap-2">
                                                    {riskAnalysis.rrRatio || '0.00'}
                                                    <span className="text-sm font-normal text-gray-400 mb-1">
                                                        {riskAnalysis.valid ? (riskAnalysis.rrRatio >= 1.5 ? t('risk.excellent') : t('risk.too_low')) : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-neutral-800 rounded-lg">
                                                    <div className="text-xs text-gray-500 mb-1">{t('risk.position_size')}</div>
                                                    <div className="text-lg font-bold font-mono text-white notranslate">
                                                        {riskAnalysis.positionSize.toLocaleString()} USDT
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-neutral-800 rounded-lg">
                                                    <div className="text-xs text-gray-500 mb-1">{t('risk.risk_per_trade')}</div>
                                                    <div className={`text-lg font-bold font-mono ${riskAnalysis.riskPercent > 10 ? 'text-red-500' : 'text-white'}`}>
                                                        {riskAnalysis.riskPercent}%
                                                    </div>
                                                </div>
                                            </div>

                                            {riskAnalysis.riskPercent > 10 && (
                                                <div className="flex gap-2 p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
                                                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                    <p className="text-xs text-red-400 leading-relaxed">
                                                        <span className="font-bold">{t('risk.warning_title')}</span>
                                                        {t('risk.warning_msg')}
                                                    </p>
                                                </div>
                                            )}

                                            {riskAnalysis.accountRiskPercent > 10 && (
                                                <div className={`flex gap-2 p-3 border rounded-lg ${riskAnalysis.accountRiskPercent > 15 ? 'bg-red-900/20 border-red-900/50' : 'bg-yellow-900/20 border-yellow-900/50'}`}>
                                                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${riskAnalysis.accountRiskPercent > 15 ? 'text-red-500' : 'text-yellow-500'}`} />
                                                    <div className="text-xs leading-relaxed">
                                                        <p className={`font-bold ${riskAnalysis.accountRiskPercent > 15 ? 'text-red-400' : 'text-yellow-400'}`}>
                                                            {riskAnalysis.accountRiskPercent > 15 ? '危险警告 (DANGER)' : '风险提示 (WARNING)'}
                                                        </p>
                                                        <p className="text-gray-400">
                                                            当前账户风险为 {riskAnalysis.accountRiskPercent}%，
                                                            {riskAnalysis.accountRiskPercent > 15 ? '严重超出安全范围 (>15%)！建议大幅降低仓位。' : '已超出建议值 (10%)，请谨慎操作。'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t border-neutral-800">
                                                <div className="text-xs text-gray-500 mb-2">{t('risk.checklist')}</div>
                                                <div className="space-y-2">
                                                    {[
                                                        { id: 'trend', label: t('risk.check_trend') },
                                                        { id: 'close', label: t('risk.check_close') },
                                                        { id: 'structure', label: t('risk.check_structure') }
                                                    ].map(item => (
                                                        <label key={item.id} className="flex items-center gap-2 cursor-pointer group">
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checklist[item.id] ? 'bg-amber-500 border-amber-500' : 'border-neutral-600 group-hover:border-neutral-500'}`}>
                                                                {checklist[item.id] && <Check className="w-3 h-3 text-black" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={checklist[item.id]}
                                                                onChange={() => setChecklist(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                                            />
                                                            <span className={`text-xs ${checklist[item.id] ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-400'}`}>{item.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Market Sentiment (Moved from AI Analysis) */}
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                                        <div className="flex items-center gap-2 mb-4 border-b border-neutral-800 pb-2">
                                            <Activity className="w-4 h-4 text-blue-400" />
                                            <h3 className="text-sm font-bold text-gray-300">{t('ai.market_sentiment')}</h3>
                                        </div>

                                        {/* BTC Price */}
                                        <div className="mb-4 bg-neutral-800/50 border border-neutral-700 rounded-xl p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#F7931A]/20 flex items-center justify-center">
                                                    <span className="text-[#F7931A] font-bold text-xs">₿</span>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-400">BTC/USDT</div>
                                                    <div className="text-sm font-bold text-white">
                                                        ${(btcMarket.price || 0).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-sm font-bold ${(btcMarket.change24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {(btcMarket.change24h || 0) >= 0 ? '+' : ''}{(btcMarket.change24h || 0).toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fear & Greed */}
                                        <div className="flex flex-col items-center justify-center py-2">
                                            {(() => {
                                                const fearIndex = 30 + (new Date().getDate() % 20);
                                                return (
                                                    <>
                                                        <div className="flex items-baseline gap-2 mb-2">
                                                            <span className="text-2xl font-black text-white">{fearIndex}</span>
                                                            <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded">{t('ai.fear')}</span>
                                                        </div>
                                                        <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                                            <div className="bg-gradient-to-r from-red-500 to-yellow-500 h-full" style={{ width: `${fearIndex}%` }}></div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-3 text-center leading-relaxed">
                                            {t('ai.sentiment_tip')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                        )}

                        {/* --- 2. 交易日记列表 --- */}
                        {activeTab === 'journal' && (
                            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
                                <div className="lg:col-span-3 w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
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
                                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                            <table className="w-full text-left text-sm whitespace-nowrap">
                                                <thead className="text-xs text-gray-500 bg-neutral-900/50 uppercase tracking-wider relative">
                                                    <tr>
                                                        <th className="px-6 py-4 bg-neutral-800 sticky top-0 z-20 font-medium">{t('journal.columns.date')}</th>
                                                        <th className="px-6 py-4 bg-neutral-800 sticky top-0 z-20 font-medium">{t('journal.columns.symbol_dir')}</th>
                                                        <th className="px-6 py-4 bg-neutral-800 sticky top-0 z-20 font-medium">{t('journal.columns.basis')}</th>
                                                        <th className="px-6 py-4 bg-neutral-800 sticky top-0 z-20 font-medium">{t('journal.columns.rr')}</th>
                                                        <th className="px-6 py-4 bg-neutral-800 sticky top-0 z-20 font-medium">{t('journal.columns.status')}</th>
                                                        <th className="px-6 py-4 bg-neutral-800 sticky top-0 z-20 text-center">{t('journal.columns.action')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-800">
                                                    {trades.map(trade => (
                                                        <tr key={trade.id} className="hover:bg-neutral-800/50 transition-colors">
                                                            <td className="px-6 py-4 font-mono text-gray-400">{trade.date}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-white">{trade.symbol}</div>
                                                                <div className={`text-xs ${trade.tradeType === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                                                    {trade.tradeType === 'buy' ? t('form.long') : t('form.short')} x{trade.leverage}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="bg-neutral-800 text-gray-300 px-2 py-1 rounded text-xs border border-neutral-700">
                                                                    {trade.timeframe}
                                                                </span>
                                                                <span className="ml-2 text-gray-400">{trade.pattern || '-'}</span>
                                                            </td>
                                                            <td className="px-6 py-4 font-mono group relative">
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
                                                            <td className="px-6 py-4">
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
                                                            <td className="px-6 py-4 text-center">
                                                                <button
                                                                    onClick={() => {
                                                                        if (trade.status === 'open') {
                                                                            handleSettleTrade(trade.id);
                                                                        }
                                                                    }}
                                                                    disabled={trade.status !== 'open'}
                                                                    className={`
                                                                    px-3 py-1 rounded border text-xs font-bold transition-all
                                                                    ${trade.status === 'open'
                                                                            ? 'border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black'
                                                                            : 'border-transparent text-gray-600 cursor-not-allowed opacity-50'}
                                                                `}
                                                                >
                                                                    {trade.status === 'open' ? t('journal.settle') : t('journal.status.closed')}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleReviewTrade(trade);
                                                                    }}
                                                                    className="ml-2 text-gray-500 hover:text-white transition-colors text-xs"
                                                                >
                                                                    {trade.review ? (
                                                                        <>
                                                                            <CheckCircle2 className="w-3 h-3" /> {t('journal.reviewed')}
                                                                        </>
                                                                    ) : (
                                                                        t('journal.review')
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTradeToDelete(trade);
                                                                        setShowDeleteModal(true);
                                                                    }}
                                                                    className="text-gray-600 hover:text-red-500 transition-colors p-1"
                                                                    title={language === 'zh' ? '删除交易' : 'Delete Trade'}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
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
                                        <div className="lg:col-span-3 space-y-6">
                                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                                    <Brain className="w-5 h-5 text-amber-500" />
                                                    {t('ai.gene_title')}
                                                </h3>

                                                {(() => {
                                                    // 只分析已结算的交易
                                                    const settledTrades = trades.filter(t => t.status === 'closed');

                                                    // 如果没有已结算的交易，显示提示信息
                                                    if (settledTrades.length === 0) {
                                                        return (
                                                            <div className="text-center py-12">
                                                                <div className="mb-4">
                                                                    <Activity className="w-16 h-16 mx-auto text-gray-600" />
                                                                </div>
                                                                <div className="text-lg font-bold text-gray-400 mb-2">
                                                                    {language === 'zh' ? '数据不足' : 'Insufficient Data'}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {language === 'zh'
                                                                        ? '请至少结算一笔交易后，AI 才能为您生成分析报告。'
                                                                        : 'Please settle at least one trade for AI analysis.'}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    // 1. Calculate Best Pattern (只用已结算的交易)
                                                    const patternStats = {};
                                                    settledTrades.forEach(trade => {
                                                        const p = trade.pattern || t('ai.unrecorded');
                                                        if (!patternStats[p]) patternStats[p] = { wins: 0, total: 0 };
                                                        patternStats[p].total++;
                                                        if (trade.profitLoss > 0) patternStats[p].wins++;
                                                    });
                                                    let bestPattern = t('ai.not_enough_data');
                                                    let bestWinRate = 0;
                                                    Object.entries(patternStats).forEach(([pattern, stats]) => {
                                                        // Skip 'Unrecorded' if possible, unless it's the only one
                                                        if (pattern === t('ai.unrecorded') && Object.keys(patternStats).length > 1) return;

                                                        const rate = stats.wins / stats.total;
                                                        if (rate >= bestWinRate && stats.total >= 1) {
                                                            bestWinRate = rate;
                                                            bestPattern = pattern;
                                                        }
                                                    });

                                                    // 2. Calculate Worst Timeframe (只用已结算的交易)
                                                    const tfStats = {};
                                                    settledTrades.forEach(trade => {
                                                        const tf = trade.timeframe || t('ai.unrecorded');
                                                        if (!tfStats[tf]) tfStats[tf] = { losses: 0, total: 0 };
                                                        tfStats[tf].total++;
                                                        if (trade.profitLoss < 0) tfStats[tf].losses++;
                                                    });
                                                    let worstTimeframe = t('ai.not_enough_data');
                                                    let worstLossRate = -1;
                                                    Object.entries(tfStats).forEach(([tf, stats]) => {
                                                        const rate = stats.losses / stats.total;
                                                        if (rate > worstLossRate && stats.total >= 1) {
                                                            worstLossRate = rate;
                                                            worstTimeframe = tf;
                                                        }
                                                    });

                                                    // 3. Calculate Discipline Score (只用已结算的交易)
                                                    // Base 100, deduct for bad R:R, deduct for large losses
                                                    let score = 100;
                                                    if (settledTrades.length > 0) {
                                                        const badRRTrades = settledTrades.filter(t => (parseFloat(t.rrRatio) || 0) < 1.5).length;
                                                        score -= (badRRTrades / settledTrades.length) * 30;

                                                        const losingTrades = settledTrades.filter(t => t.profitLoss < 0);
                                                        const winningTrades = settledTrades.filter(t => t.profitLoss > 0);

                                                        const avgLoss = losingTrades.length > 0
                                                            ? losingTrades.reduce((acc, t) => acc + Math.abs(t.profitLoss), 0) / losingTrades.length
                                                            : 0;
                                                        const avgWin = winningTrades.length > 0
                                                            ? winningTrades.reduce((acc, t) => acc + t.profitLoss, 0) / winningTrades.length
                                                            : 1; // Avoid division by zero if no wins

                                                        if (avgLoss > avgWin) score -= 20;
                                                    }

                                                    // 4. Review & PnL Check (只用已结算的交易)
                                                    const reviewedTrades = settledTrades.filter(t => t.review && t.review.length > 5).length;
                                                    const reviewRate = settledTrades.length > 0 ? reviewedTrades / settledTrades.length : 0;
                                                    if (reviewRate < 0.5) score -= 10; // Deduct if less than 50% reviewed

                                                    const totalPnL = settledTrades.reduce((acc, t) => acc + (t.profitLoss || 0), 0);

                                                    score = Math.max(0, Math.round(score));

                                                    return (
                                                        <>
                                                            <div className="grid grid-cols-3 gap-4 mb-6">
                                                                <div className="p-4 bg-neutral-800/50 rounded-xl text-center border border-neutral-700">
                                                                    <div className="text-xs text-gray-500 mb-1">{t('ai.best_pattern')}</div>
                                                                    {settledTrades.length < 5 ? (
                                                                        <div className="text-sm text-gray-500 py-2">{language === 'zh' ? '数据不足' : 'Insufficient Data'}</div>
                                                                    ) : (
                                                                        <>
                                                                            <div className="text-lg font-bold text-green-400">{bestPattern}</div>
                                                                            <div className="text-xs text-gray-600 mt-1">{t('journal.win_rate')} {bestPattern !== t('ai.not_enough_data') ? (bestWinRate * 100).toFixed(0) : 0}%</div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="p-4 bg-neutral-800/50 rounded-xl text-center border border-neutral-700">
                                                                    <div className="text-xs text-gray-500 mb-1">{t('ai.worst_timeframe')}</div>
                                                                    {settledTrades.length < 5 ? (
                                                                        <div className="text-sm text-gray-500 py-2">{language === 'zh' ? '数据不足' : 'Insufficient Data'}</div>
                                                                    ) : (
                                                                        <>
                                                                            <div className="text-lg font-bold text-red-400">{worstTimeframe}</div>
                                                                            <div className="text-xs text-gray-600 mt-1">{t('journal.status.loss')} {worstTimeframe !== t('ai.not_enough_data') ? (worstLossRate * 100).toFixed(0) : 0}%</div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="p-4 bg-neutral-800/50 rounded-xl text-center border border-neutral-700 relative group">
                                                                    <div className="flex items-center justify-center gap-1.5 mb-1">
                                                                        <div className="text-xs text-gray-500 border-b border-dashed border-gray-600 inline-block">{t('ai.discipline_score')}</div>
                                                                        <Info className="w-3.5 h-3.5 text-gray-600 group-hover:text-amber-500 transition-colors cursor-help" />
                                                                    </div>
                                                                    <div className={`text-lg font-bold ${score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{score}/100</div>
                                                                    <div className="text-xs text-gray-600 mt-1">{score >= 80 ? t('ai.score_excellent') : score >= 60 ? t('ai.score_good') : t('ai.score_bad')}</div>

                                                                    {/* Tooltip */}
                                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-black border border-neutral-700 rounded-lg shadow-xl text-xs text-left text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                                        <div className="font-bold text-white mb-1">评分规则：</div>
                                                                        <ul className="list-disc list-inside space-y-1">
                                                                            <li><span className="text-red-400">盈亏比 &lt; 1.5</span>：扣分 (权重最高)</li>
                                                                            <li><span className="text-red-400">平均亏损 &gt; 盈利</span>：扣 20 分</li>
                                                                            <li><span className="text-amber-500">复盘率 &lt; 50%</span>：扣 10 分</li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-neutral-800/30 p-5 rounded-xl border border-neutral-800">
                                                                <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                                                    <MessageSquare className="w-4 h-4 text-blue-400" /> {t('ai.diagnosis_title')}
                                                                </h4>
                                                                <p className="text-sm text-gray-400 leading-relaxed">
                                                                    {t('ai.diagnosis_intro', { count: trades.length })}
                                                                    {trades.length < 5 ? (
                                                                        t('ai.diagnosis_short')
                                                                    ) : (
                                                                        <>
                                                                            {t('ai.diagnosis_pattern', { pattern: bestPattern })}
                                                                            {t('ai.diagnosis_timeframe', { timeframe: worstTimeframe })}
                                                                            {score < 60 && t('ai.diagnosis_discipline')}
                                                                            {reviewRate < 0.5 && <span className="block text-amber-500 mt-1">⚠️ {t('ai.review_warning', { rate: (reviewRate * 100).toFixed(0) })}</span>}
                                                                            <span className={`block mt-2 font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                                {t('ai.pnl_status', {
                                                                                    pnl: (totalPnL >= 0 ? '+' : '') + totalPnL.toFixed(2) + ' USDT',
                                                                                    comment: totalPnL < 0 ? t('ai.pnl_comment_bad') : t('ai.pnl_comment_good')
                                                                                })}
                                                                            </span>

                                                                            {/* 详细统计分析 */}
                                                                            <div className="mt-4 p-3 bg-neutral-900/50 rounded-lg border border-neutral-700">
                                                                                <div className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2">
                                                                                    <BarChart3 className="w-3 h-3" /> {t('ai.detailed_analysis')}
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                    <div>
                                                                                        <span className="text-gray-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {t('ai.long_win_rate')}:</span>
                                                                                        <span className="text-green-400 font-bold">
                                                                                            {(() => {
                                                                                                const longs = settledTrades.filter(t => t.direction === 'long' || t.tradeType === 'buy');
                                                                                                const longWins = longs.filter(t => t.profitLoss > 0).length;
                                                                                                return longs.length > 0 ? ((longWins / longs.length) * 100).toFixed(0) + '%' : 'N/A';
                                                                                            })()}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-gray-500 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> {t('ai.short_win_rate')}:</span>
                                                                                        <span className="text-red-400 font-bold">
                                                                                            {(() => {
                                                                                                const shorts = settledTrades.filter(t => t.direction === 'short' || t.tradeType === 'sell');
                                                                                                const shortWins = shorts.filter(t => t.profitLoss > 0).length;
                                                                                                return shorts.length > 0 ? ((shortWins / shorts.length) * 100).toFixed(0) + '%' : 'N/A';
                                                                                            })()}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-gray-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> {t('ai.avg_profit_label')}:</span>
                                                                                        <span className="text-green-400 font-bold">
                                                                                            {(() => {
                                                                                                const wins = trades.filter(t => t.profitLoss > 0);
                                                                                                const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.profitLoss, 0) / wins.length : 0;
                                                                                                return '+$' + avgWin.toFixed(2);
                                                                                            })()}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-gray-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {t('ai.avg_loss_label')}:</span>
                                                                                        <span className="text-red-400 font-bold">
                                                                                            {(() => {
                                                                                                const losses = trades.filter(t => t.profitLoss < 0);
                                                                                                const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + Math.abs(t.profitLoss), 0) / losses.length : 0;
                                                                                                return '-$' + avgLoss.toFixed(2);
                                                                                            })()}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="col-span-2">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-gray-500 flex items-center gap-1"><Target className="w-3 h-3" /> {t('ai.rr_ratio_label')}:</span>
                                                                                            <span className="text-amber-400 font-bold">
                                                                                                {(() => {
                                                                                                    const wins = trades.filter(t => t.profitLoss > 0);
                                                                                                    const losses = trades.filter(t => t.profitLoss < 0);
                                                                                                    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.profitLoss, 0) / wins.length : 0;
                                                                                                    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.profitLoss, 0) / losses.length) : 1;
                                                                                                    const plRatio = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : 'N/A';
                                                                                                    return plRatio + ' ' + (plRatio >= 1.5 ? '✅' : plRatio >= 1 ? '⚠️' : '❌');
                                                                                                })()}
                                                                                            </span>
                                                                                            <span className="text-gray-600 text-xs">{t('ai.rr_recommendation')}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </p>
                                                            </div>

                                                            {/* 资金曲线 */}
                                                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                                                                <h3 className="text-lg font-bold text-white mb-4">{t('ai.equity_curve')}</h3>
                                                                <div className="h-[250px] w-full">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <AreaChart data={trades.filter(t => t.status === 'closed').slice().reverse().reduce((acc, t) => {
                                                                            const lastVal = acc.length > 0 ? acc[acc.length - 1].val : 0;
                                                                            const pnl = parseFloat(t.profitLoss) || 0;
                                                                            acc.push({ i: acc.length, val: lastVal + pnl });
                                                                            return acc;
                                                                        }, [])}>
                                                                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                                                                            <XAxis dataKey="i" hide />
                                                                            <YAxis domain={['auto', 'auto']} stroke="#525252" fontSize={10} />
                                                                            <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040' }} />
                                                                            <Area type="monotone" dataKey="val" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.1} />
                                                                        </AreaChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        }
                    </>
                )}
            </main >

            {/* Payment Modal */}
            {
                showPaymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                        <div className="bg-neutral-900 w-full max-w-2xl rounded-2xl border border-neutral-800 p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Crown className="w-32 h-32 text-amber-500" />
                            </div>
                            <h3 className="text-2xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent mb-2">{t('payment.title')}</h3>
                            <p className="text-gray-400 mb-8">{t('payment.subtitle')}</p>

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
                                    {/* Price and Features Display */}
                                    <div className="mb-6">
                                        <div className="text-center mb-8 p-6 bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl border-2 border-amber-500/30">
                                            <div className="text-xl font-black text-white mb-1">{t('payment.usd')}</div>
                                            <div className="text-5xl font-black text-white mb-2">$15.00</div>
                                            <div className="text-xs text-green-400 font-bold bg-green-500/10 px-3 py-1.5 rounded-full inline-block">
                                                {t('payment.lifetime_access')}
                                            </div>
                                        </div>

                                        {/* Feature List */}
                                        <ul className="space-y-3 mb-6">
                                            {t('pricing.pro_features', { returnObjects: true }).map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3 text-white">
                                                    <div className="bg-amber-500/20 rounded-full p-0.5">
                                                        <Check className="w-4 h-4 text-amber-500 shrink-0" />
                                                    </div>
                                                    <span className="text-sm font-medium">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Payment Button */}
                                        <button
                                            onClick={handleUpgrade}
                                            disabled={isUpgrading}
                                            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUpgrading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Creating Session...</span>
                                                </div>
                                            ) : (
                                                t('pricing.get_pro')
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                        <Shield className="w-4 h-4" />
                                        <span>SSL 安全加密支付</span>
                                    </div>
                                </>
                            ) : paymentMethod === 'usdt' ? (
                                <>
                                    {/* USDT 手动支付界面 */}
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={() => setPaymentMethod(null)} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white rounded-lg transition-all">
                                            <ArrowRight className="w-4 h-4 rotate-180" /> 返回选择支付方式
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-xs text-gray-400">{t('payment.order_number')}</div>
                                                <button
                                                    onClick={() => {
                                                        const orderNum = orderNumber || 'ORDER-' + Date.now();
                                                        navigator.clipboard.writeText(orderNum);
                                                        setToastMessage(t('payment.copied'));
                                                        setShowSuccessToast(true);
                                                    }}
                                                    className="flex items-center gap-1 text-amber-500 hover:text-amber-400 text-xs"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    {t('payment.copy')}
                                                </button>
                                            </div>
                                            <div className="text-lg font-mono text-amber-500">{orderNumber || 'ORDER-' + Date.now()}</div>
                                        </div>

                                        <div className="p-4 bg-neutral-800 rounded-xl">
                                            <div className="text-xs text-gray-400 mb-2">{t('payment.receiving_address')}</div>
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
                                            <div className="text-3xl font-black text-amber-500">15.00 USDT</div>
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
                                                            amount: 15,
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

            {/* 成功提示 Toast */}
            {
                showSuccessToast && (
                    <div className="fixed bottom-8 right-8 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300">
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

            {/* 错误提示 Toast */}
            {
                showErrorToast && (
                    <div className="fixed bottom-8 right-8 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-black/60 backdrop-blur-xl border border-red-500/30 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 ring-1 ring-red-500/20">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <div className="font-bold text-sm tracking-wide text-red-400">{t('common.error')}</div>
                                <div className="text-xs text-gray-400">{errorMessage}</div>
                            </div>
                            <button onClick={() => setShowErrorToast(false)} className="ml-2 text-gray-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
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

                                <button onClick={isRegisterMode ? handleRegister : handleLogin} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl">
                                    {isRegisterMode ? t('auth.register_btn') : t('auth.login_btn')}
                                </button>

                                <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
                                    <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="text-amber-500 hover:underline">
                                        {isRegisterMode ? t('auth.to_login') : t('auth.to_register')}
                                    </button>

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
                            <p className="text-xs text-gray-400 mb-4">{t('journal.review_desc')}</p>
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
                                            {membership.isPremium && (
                                                <div className="text-xs text-gray-500">
                                                    {t('settings.expires_on')}: {membership.expiryDate ? new Date(membership.expiryDate).toLocaleDateString() : '-'}
                                                </div>
                                            )}
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
                        email: user?.email || ''
                    });
                    setShowFeedbackModal(true);
                }}
                className="fixed bottom-24 right-6 z-50 bg-amber-500 hover:bg-amber-400 text-black p-4 rounded-full shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-110 transition-all group"
            >
                <MessageSquare className="w-6 h-6" />
            </button>

            {/* 反馈弹窗 */}
            {
                showFeedbackModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 w-full max-w-md rounded-2xl border border-amber-500/20 p-8 shadow-2xl relative animate-in zoom-in duration-300">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-amber-500" />
                                {t('feedback.title')}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2">{t('feedback.name_label')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('feedback.name_placeholder')}
                                        value={feedbackForm.name}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 mb-2">{t('feedback.email_label')} *</label>
                                    <input
                                        type="email"
                                        placeholder={t('feedback.email_placeholder')}
                                        value={feedbackForm.email}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 mb-2">{t('feedback.type_label')}</label>
                                    <select
                                        value={feedbackForm.type}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                                    >
                                        <option value="suggestion">{t('feedback.types.suggestion')}</option>
                                        <option value="bug">{t('feedback.types.bug')}</option>
                                        <option value="account">{t('feedback.types.account')}</option>
                                        <option value="other">{t('feedback.types.other')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 mb-2">{t('feedback.content_label')} *</label>
                                    <textarea
                                        placeholder={t('feedback.content_placeholder')}
                                        value={feedbackForm.content}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                                        rows={5}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleSubmitFeedback}
                                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:scale-105"
                                    >
                                        {t('feedback.submit_btn')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const email = 'support@goldcat.trade';
                                            navigator.clipboard.writeText(email);
                                            setToastMessage(t('payment.copied'));
                                            setShowSuccessToast(true);
                                        }}
                                        className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105"
                                    >
                                        <Copy className="w-4 h-4" />
                                        {t('feedback.email_btn')}
                                    </button>
                                </div>
                            </div>

                            <button onClick={() => setShowFeedbackModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Footer with Privacy and Terms */}
            <div className="w-full bg-black/90 border-t border-neutral-800 py-3 px-4 z-[9999] mt-auto">
                <div className="flex justify-center items-center gap-6">
                    <button
                        onClick={() => setCurrentPage('privacy')}
                        className="text-xs text-gray-400 hover:text-amber-500 transition-colors underline"
                    >
                        {language === 'zh' ? '隐私政策' : 'Privacy Policy'}
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                        onClick={() => setCurrentPage('terms')}
                        className="text-xs text-gray-400 hover:text-amber-500 transition-colors underline"
                    >
                        {language === 'zh' ? '服务条款' : 'Terms of Service'}
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                        onClick={() => setShowDisclaimer(!showDisclaimer)}
                        className="text-xs text-gray-400 hover:text-amber-500 transition-colors underline flex items-center gap-1"
                    >
                        <AlertTriangle className="w-3 h-3" />
                        {language === 'zh' ? '风险提示' : 'Risk Disclaimer'}
                    </button>
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
        </div >
    );
}

export default GoldCatApp;

