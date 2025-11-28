import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
    TrendingUp, TrendingDown, DollarSign, Package, AlertCircle, BarChart3, Target,
    Award, Plus, X, Crown, Calendar, CreditCard, Wallet, User, LogOut, Trash2,
    Infinity, Activity, Zap, FileText, Brain, Sparkles, CheckCircle2, AlertTriangle,
    Lightbulb, Shield, Globe, MessageSquare, Cpu, ChevronRight, Lock, Settings,
    PieChart, BarChart, ArrowRight, Compass, Edit3, ShieldCheck, Coins, Copy
} from 'lucide-react';

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
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, ReferenceLine, Bar, Cell, Pie
} from 'recharts';
import { translations } from './translations';

// --- 1. 模拟数据与常量 ---

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
const INITIAL_PATTERNS = [
    '头肩顶', '头肩底', '双顶', '双底', '上升三角', '下降三角',
    '对称三角', '旗形', '楔形', '圆弧顶', '圆弧底', '矩形整理',
    'V型反转', 'W底', 'M顶', '趋势线突破', '回踩确认'
];

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
    const [paymentMethod, setPaymentMethod] = useState('usdt');
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // 多语言支持
    // 多语言支持
    const [language, setLanguage] = useState(() => {
        // 1. 优先使用用户手动选择的语言
        const saved = localStorage.getItem('goldcat_language');
        if (saved) return saved;

        // 2. 其次根据浏览器语言判断 (模拟 IP 判断)
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && (browserLang.toLowerCase() === 'zh' || browserLang.toLowerCase().startsWith('zh-'))) {
            return 'zh';
        }

        // 3. 默认英语
        return 'en';
    });

    // 监听语言变化并保存
    useEffect(() => {
        localStorage.setItem('goldcat_language', language);
    }, [language]);

    const t = (path, params = {}) => {
        const keys = path.split('.');
        let value = translations[language];
        for (const key of keys) {
            value = value?.[key];
        }
        if (!value) return path;

        // Simple parameter replacement
        Object.entries(params).forEach(([k, v]) => {
            value = value.replace(`{${k}}`, v);
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
    const [customPatterns, setCustomPatterns] = useState(INITIAL_PATTERNS);

    const [btcMarket, setBtcMarket] = useState({ price: 0, change24h: 0, loading: true });
    const [totalCapital, setTotalCapital] = useState(10000);
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
        pattern: '',
        timeframe: '4h',
        notes: ''
    });

    // 实时计算状态
    const [riskAnalysis, setRiskAnalysis] = useState({ rrRatio: 0, positionSize: 0, riskPercent: 0, valid: false });
    const [validationErrors, setValidationErrors] = useState({ stopLoss: '', takeProfit: '' });
    const [showCloseTradeModal, setShowCloseTradeModal] = useState(false);
    const [selectedTradeId, setSelectedTradeId] = useState(null);
    const [closePnL, setClosePnL] = useState('');


    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewNote, setReviewNote] = useState('');
    const [paymentTxId, setPaymentTxId] = useState(''); // Payment Transaction ID
    const [orderNumber, setOrderNumber] = useState(''); // USDT Order Number

    // Pattern Management
    const [patterns, setPatterns] = useState(['突破 (Breakout)', '回调 (Pullback)', '趋势跟随 (Trend)', '反转 (Reversal)', '区间震荡 (Range)']);
    const [showPatternModal, setShowPatternModal] = useState(false);
    const [newPattern, setNewPattern] = useState('');

    // Load User Data Effect
    useEffect(() => {
        const loadUserData = async () => {
            if (user && user.email) {
                const userKey = user.email;

                // 1. Load Local Data (Trades, Patterns, Capital)
                const savedTrades = JSON.parse(localStorage.getItem(`goldcat_trades_${userKey}`)) || [];
                const savedPatterns = JSON.parse(localStorage.getItem(`goldcat_patterns_${userKey}`)) || ['突破 (Breakout)', '回调 (Pullback)', '趋势跟随 (Trend)', '反转 (Reversal)', '区间震荡 (Range)'];
                const savedCapital = parseFloat(localStorage.getItem(`goldcat_total_capital_${userKey}`)) || 10000;

                setTrades(savedTrades);
                setPatterns(savedPatterns);
                setTotalCapital(savedCapital);

                // 2. Load Membership from Supabase DB
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
                        // Fallback if profile doesn't exist yet (should be created by trigger, but just in case)
                        setMembership({ isPremium: false, expiryDate: null, maxTrades: 20 });
                    }
                } catch (err) {
                    console.error('Error loading profile:', err);
                    // Fallback to local or default
                    const savedMembership = JSON.parse(localStorage.getItem(`goldcat_membership_${userKey}`)) || { isPremium: false, expiryDate: null, maxTrades: 20 };
                    setMembership(savedMembership);
                }

            } else {
                // Reset to defaults if no user (or logout)
                setTrades([]);
                setPatterns(['突破 (Breakout)', '回调 (Pullback)', '趋势跟随 (Trend)', '反转 (Reversal)', '区间震荡 (Range)']);
                setTotalCapital(10000);
                setMembership({ isPremium: false, expiryDate: null, maxTrades: 20 });
            }
        };

        loadUserData();
    }, [user]);

    // 持久化副作用 - User Bound
    // Load User Data Effect
    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (user && user.email) {
            const userKey = user.email;
            const savedTrades = JSON.parse(localStorage.getItem(`goldcat_trades_${userKey}`)) || [];
            const savedPatterns = JSON.parse(localStorage.getItem(`goldcat_patterns_${userKey}`)) || ['突破 (Breakout)', '回调 (Pullback)', '趋势跟随 (Trend)', '反转 (Reversal)', '区间震荡 (Range)'];
            const savedCapital = parseFloat(localStorage.getItem(`goldcat_total_capital_${userKey}`)) || 10000;
            // For now, still load membership from local storage until we have the profiles table set up
            const savedMembership = JSON.parse(localStorage.getItem(`goldcat_membership_${userKey}`)) || { isPremium: false, expiryDate: null, maxTrades: 20 };

            setTrades(savedTrades);
            setPatterns(savedPatterns);
            setTotalCapital(savedCapital);
            setMembership(savedMembership);
        } else {
            // Reset to defaults if no user (or logout)
            setTrades([]);
            setPatterns(['突破 (Breakout)', '回调 (Pullback)', '趋势跟随 (Trend)', '反转 (Reversal)', '区间震荡 (Range)']);
            setTotalCapital(10000);
            setMembership({ isPremium: false, expiryDate: null, maxTrades: 20 });
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
            setOrderNumber(`ORDER-${Date.now()}`);
        }
    }, [paymentMethod, orderNumber]);

    useEffect(() => {
        if (user && user.email) {
            localStorage.setItem(`goldcat_trades_${user.email}`, JSON.stringify(trades));
        }
    }, [trades, user]);

    useEffect(() => {
        if (user && user.email) {
            localStorage.setItem(`goldcat_total_capital_${user.email}`, totalCapital);
        }
    }, [totalCapital, user]);

    // 获取 BTC 行情
    // Simulate Market Data Updates
    useEffect(() => {
        // Initial random data
        setBtcMarket({ price: 65432.10, change24h: 2.5, loading: false });

        const interval = setInterval(() => {
            setBtcMarket(prev => ({
                price: prev.price * (1 + (Math.random() - 0.5) * 0.002),
                change24h: prev.change24h + (Math.random() - 0.5) * 0.5,
                loading: false
            }));
        }, 3000);
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
                if (stop >= entry) errors.stopLoss = '做多止损必须低于入场价';
                if (take <= entry) errors.takeProfit = '做多止盈必须高于入场价';

                if (stop < entry && take > entry) {
                    risk = entry - stop;
                    reward = take - entry;
                    isValidLogic = true;
                }
            } else {
                // 做空: TP < Entry < SL
                if (stop <= entry) errors.stopLoss = '做空止损必须高于入场价';
                if (take >= entry) errors.takeProfit = '做空止盈必须低于入场价';

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

    const handleSubmitTrade = () => {
        // 1. 权限检查
        if (!membership.isPremium && trades.length >= membership.maxTrades) {
            setPaymentMethod(null);
            setShowPaymentModal(true);
            return;
        }

        // 2. 必填检查
        if (!formData.symbol || !formData.entryPrice || !formData.margin) {
            alert("【交易纪律】请完整填写交易要素，不可遗漏。");
            return;
        }

        // 3. 盈亏比检查（软性提醒）
        if (riskAnalysis.valid && riskAnalysis.rrRatio < 1.5) {
            if (!window.confirm(`⚠️ 警告：当前盈亏比仅为 ${riskAnalysis.rrRatio}，不符合高胜率交易标准。是否强制记录？`)) {
                return;
            }
        }

        const newTrade = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            ...formData,
            ...riskAnalysis,
            status: 'open', // open, win, loss
            profitLoss: 0 // 结单后更新
        };

        setTrades([newTrade, ...trades]);

        // 显示成功反馈
        // 显示成功反馈
        setShowSuccessToast(true);

        // 保存自定义形态
        if (formData.pattern && !customPatterns.includes(formData.pattern)) {
            setCustomPatterns(prev => [...prev, formData.pattern]);
        }

        // 重置表单 but keep some preferences
        setFormData(prev => ({
            ...prev,
            symbol: '', entryPrice: '', stopLoss: '', takeProfit: '', notes: '', margin: ''
        }));
    };

    // 模拟登录
    // 模拟登录 -> Supabase Login
    const handleLogin = async () => {
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
            setShowSuccessToast(true);
        }
    };

    const handleDemoLogin = () => {
        setLoginForm({ email: 'demo@goldcat.com', password: 'demo123' });
        // The original handleLogin logic is more complex, so we'll call it directly
        // after setting the form, rather than duplicating its internal logic.
        // This assumes handleLogin can correctly process the pre-filled form.
        handleLogin();
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
        setShowCloseTradeModal(true);
    };

    // 确认结算
    const confirmSettleTrade = () => {
        if (!closePnL) return;
        const pnlValue = parseFloat(closePnL);
        if (isNaN(pnlValue)) {
            setErrorMessage(t('common.error'));
            setShowErrorToast(true);
            setTimeout(() => setShowErrorToast(false), 3000);
            return;
        }

        setTrades(trades.map(t =>
            t.id === selectedTradeId
                ? { ...t, status: 'closed', profitLoss: pnlValue }
                : t
        ));
        setShowCloseTradeModal(false);
        setSelectedTradeId(null);
        setShowSuccessToast(true);
        setShowSuccessToast(true);
    };

    // 复盘交易
    const handleReviewTrade = (trade) => {
        setSelectedTradeId(trade.id);
        setReviewNote(trade.review || '');
        setShowReviewModal(true);
    };

    const saveReview = () => {
        setTrades(trades.map(t =>
            t.id === selectedTradeId
                ? { ...t, review: reviewNote }
                : t
        ));
        setShowReviewModal(false);
        setShowSuccessToast(true);
        setShowReviewModal(false);
        setShowSuccessToast(true);
    };

    const addPattern = () => {
        if (newPattern && !patterns.includes(newPattern)) {
            setPatterns([...patterns, newPattern]);
            setNewPattern('');
        }
    };

    const removePattern = (p) => {
        setPatterns(patterns.filter(item => item !== p));
    };

    // 退出登录
    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        await supabase.auth.signOut();
        // State updates handled by onAuthStateChange
        setActiveTab('new_trade');
        setShowLogoutModal(false);
    };

    // 统计数据计算
    const stats = useMemo(() => {
        const total = trades.length;
        const wins = trades.filter(t => t.profitLoss > 0).length;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
        const totalPnL = trades.reduce((acc, t) => acc + (t.profitLoss || 0), 0);
        return { total, wins, winRate, totalPnL };
    }, [trades]);

    // --- 4. 界面渲染 ---

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-amber-500/30 notranslate" translate="no">

            {/* 顶部导航 */}
            <nav className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src="/goldcat_logo_transparent.png?v=2" alt="GoldCat Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-white tracking-tighter leading-none">
                                {t('app_title')} <span className="text-amber-500 text-[10px] align-top">v0.1.0</span>
                            </h1>
                            <p className="text-[10px] text-gray-500 font-mono tracking-widest">{t('slogan')}</p>
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
                                    <button onClick={() => { setPaymentMethod(null); setShowPaymentModal(true); }} className="bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> 升级会员
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
                            className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 text-xs font-bold text-gray-400 hover:text-white flex items-center justify-center"
                        >
                            {language === 'zh' ? 'EN' : '中'}
                        </button>
                    </div>
                </div>
            </nav >

            {/* Fortune Compass Widget */}
            {
                user && activeTab === 'new_trade' && (
                    <div className="max-w-7xl mx-auto px-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <FortuneCompass
                            language={language}
                            t={t}
                            user={user}
                            isPremium={membership.isPremium}
                            onOpenSettings={() => setShowSettingsModal(true)}
                            onUpgrade={() => { setPaymentMethod(null); setShowPaymentModal(true); }}
                        />
                    </div>
                )
            }

            <main className="max-w-7xl mx-auto px-4 py-6">

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
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-bold mb-8 tracking-wider uppercase backdrop-blur-md shadow-lg">
                                <Sparkles className="w-3 h-3 animate-pulse" /> {t('app_title')} v4.0
                            </div>

                            <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tight leading-tight drop-shadow-2xl">
                                {t('home.title')}
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 pb-2">
                                    {t('slogan')}
                                </span>
                            </h1>

                            <p className="text-gray-300 text-lg md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                                {t('home.desc_1')} {t('home.desc_2')}
                            </p>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-20">
                                <button
                                    onClick={handleDemoLogin}
                                    className="group relative w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-black font-black text-xl px-10 py-5 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-3 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <span className="relative flex items-center gap-2">{t('home.start_btn')} <ChevronRight className="w-6 h-6" /></span>
                                </button>
                                <button
                                    onClick={() => setShowLoginModal(true)}
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
                                flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all
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
                                            交易执行单
                                        </h2>
                                        <span className="text-xs bg-neutral-800 text-gray-400 px-2 py-1 rounded">
                                            今日第 {trades.filter(t => t.date === new Date().toLocaleDateString()).length + 1} 笔
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
                                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                                                >
                                                    {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-1">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <label className="block text-xs text-gray-500">{t('form.pattern')}</label>
                                                    <button onClick={() => setShowPatternModal(true)} className="text-[10px] text-amber-500 hover:underline flex items-center gap-1">
                                                        <Settings className="w-3 h-3" /> 管理
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

                                        {/* 第二行：资金管理 */}
                                        <div className="p-4 bg-neutral-800/30 border border-neutral-800 rounded-xl">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Wallet className="w-4 h-4 text-amber-500" />
                                                <span className="text-sm font-bold text-gray-300">{t('form.capital_management')}</span>
                                            </div>
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
                                                    onClick={handleSubmitTrade}
                                                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black text-lg font-black rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
                                                >
                                                    {t('form.submit_btn')}
                                                </button>
                                            )}
                                            <p className="text-center text-xs text-gray-600 mt-3">
                                                {t('form.honest_note')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 右侧：实时风控面板 */}
                                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-fit">
                                    <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-amber-500" />
                                        {t('risk.title')}
                                    </h3>


                                    {/* Total Capital Management */}
                                    <div className="mb-4 p-3 bg-neutral-800 rounded-xl border border-neutral-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-gray-400">账户总资金 (Total Capital)</span>
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
                                                    onChange={(e) => setTotalCapital(parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-sm text-white font-mono"
                                                    autoFocus
                                                />
                                                <button onClick={() => setIsEditingCapital(false)} className="bg-green-600 text-white px-2 py-1 rounded text-xs">OK</button>
                                            </div>
                                        ) : (
                                            <div className="text-xl font-black font-mono text-white tracking-wider">
                                                ${totalCapital.toLocaleString()}
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
                                                <div className={`text-lg font-bold font-mono ${riskAnalysis.riskPercent > 5 ? 'text-red-500' : 'text-white'}`}>
                                                    {riskAnalysis.riskPercent}%
                                                </div>
                                            </div>
                                        </div>

                                        {riskAnalysis.riskPercent > 5 && (
                                            <div className="flex gap-2 p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
                                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                <p className="text-xs text-red-400 leading-relaxed">
                                                    <span className="font-bold">{t('risk.warning_title')}</span>
                                                    {t('risk.warning_msg')}
                                                </p>
                                            </div>
                                        )}

                                        {riskAnalysis.accountRiskPercent > 2 && (
                                            <div className={`flex gap-2 p-3 border rounded-lg ${riskAnalysis.accountRiskPercent > 5 ? 'bg-red-900/20 border-red-900/50' : 'bg-yellow-900/20 border-yellow-900/50'}`}>
                                                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${riskAnalysis.accountRiskPercent > 5 ? 'text-red-500' : 'text-yellow-500'}`} />
                                                <div className="text-xs leading-relaxed">
                                                    <p className={`font-bold ${riskAnalysis.accountRiskPercent > 5 ? 'text-red-400' : 'text-yellow-400'}`}>
                                                        {riskAnalysis.accountRiskPercent > 5 ? '危险警告 (DANGER)' : '风险提示 (WARNING)'}
                                                    </p>
                                                    <p className="text-gray-400">
                                                        当前账户风险为 {riskAnalysis.accountRiskPercent}%，
                                                        {riskAnalysis.accountRiskPercent > 5 ? '严重超出安全范围 (>5%)！建议大幅降低仓位。' : '已超出建议值 (2%)，请谨慎操作。'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 pt-4 border-t border-neutral-800">
                                            <div className="text-xs text-gray-500 mb-2">{t('risk.checklist')}</div>
                                            <ul className="space-y-2">
                                                {[
                                                    t('risk.check_trend'),
                                                    t('risk.check_close'),
                                                    t('risk.check_structure')
                                                ].map((item, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                                                        <div className="w-3 h-3 rounded-full border border-gray-600"></div>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- 2. 交易日记列表 --- */}
                        {activeTab === 'journal' && (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">{t('journal.title')}</h2>
                                    <div className="text-sm text-gray-400">
                                        {t('journal.win_rate')}: <span className="text-amber-500 font-bold">{stats.winRate}%</span>
                                        <span className="mx-2">|</span>
                                        {t('journal.net_pnl')}: <span className={stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}>${stats.totalPnL.toFixed(2)}</span>
                                    </div>
                                </div>
                                {trades.length === 0 ? (
                                    <div className="p-20 text-center text-gray-600">
                                        <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                        <p>{t('journal.empty_state')}</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-neutral-800">
                                                <tr>
                                                    <th className="px-6 py-4">{t('journal.columns.date')}</th>
                                                    <th className="px-6 py-4">{t('journal.columns.symbol_dir')}</th>
                                                    <th className="px-6 py-4">{t('journal.columns.basis')}</th>
                                                    <th className="px-6 py-4">{t('journal.columns.rr')}</th>
                                                    <th className="px-6 py-4">{t('journal.columns.status')}</th>
                                                    <th className="px-6 py-4">{t('journal.columns.action')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-800">
                                                {trades.map(trade => (
                                                    <tr key={trade.id} onClick={() => handleReviewTrade(trade)} className="hover:bg-neutral-800/50 transition-colors cursor-pointer">
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
                                                        <td className="px-6 py-4 font-mono">{trade.rrRatio}</td>
                                                        <td className="px-6 py-4">
                                                            {trade.status === 'open' ? (
                                                                <span className="text-amber-500 text-xs font-bold border border-amber-500/30 px-2 py-1 rounded-full">{t('journal.status.open')}</span>
                                                            ) : (
                                                                <span className={`text-xs font-bold ${trade.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                    {trade.profitLoss >= 0 ? t('journal.status.profit') : t('journal.status.loss')} ${Math.abs(trade.profitLoss).toFixed(2)}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 flex gap-2">
                                                            {trade.status === 'open' ? (
                                                                <button
                                                                    onClick={() => handleSettleTrade(trade.id)}
                                                                    className="text-amber-500 hover:text-amber-400 font-bold transition-colors text-xs border border-amber-500/30 px-2 py-1 rounded"
                                                                >
                                                                    {t('journal.settle')}
                                                                </button>
                                                            ) : (
                                                                <span className="text-gray-600 cursor-not-allowed text-xs px-2 py-1">{t('journal.status.closed')}</span>
                                                            )}
                                                            <button
                                                                onClick={() => handleReviewTrade(trade)}
                                                                className={`text-xs transition-colors flex items-center gap-1 ${trade.review ? 'text-amber-500 font-bold' : 'text-gray-500 hover:text-white'}`}
                                                            >
                                                                {trade.review ? (
                                                                    <>
                                                                        <CheckCircle2 className="w-3 h-3" /> 已复盘
                                                                    </>
                                                                ) : (
                                                                    '复盘'
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- 3. AI 行为诊断 (核心卖点) --- */}
                        {activeTab === 'ai_analysis' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
                                {/* 会员锁定遮罩 */}
                                {!membership.isPremium && (
                                    <div className="lg:col-span-3 bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-2xl p-8 text-center border border-amber-500/30 relative overflow-hidden flex flex-col items-center justify-center py-20">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                                        <Lock className="w-16 h-16 text-amber-500 mb-6 relative z-10" />
                                        <h2 className="text-3xl font-black text-white mb-4 relative z-10">解锁 AI 深度交易诊断</h2>
                                        <p className="text-gray-400 max-w-xl mb-8 text-lg relative z-10">
                                            免费版仅支持基础记录。升级会员，AI 将为您生成专属的《交易行为深度诊断报告》，精准定位亏损根源，助您建立稳定盈利系统。
                                        </p>
                                        <button onClick={() => { setPaymentMethod(null); setShowPaymentModal(true); }} className="relative z-10 bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-4 rounded-xl shadow-xl shadow-amber-500/20 text-lg hover:scale-105 transition-transform flex items-center gap-2">
                                            <Crown className="w-5 h-5" /> 立即升级解锁
                                        </button>
                                    </div>
                                )}

                                {membership.isPremium && (
                                    <>
                                        <div className="lg:col-span-2 space-y-6">
                                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                                    <Brain className="w-5 h-5 text-amber-500" />
                                                    {t('ai.gene_title')}
                                                </h3>
                                                <div className="mb-6 bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[#F7931A]/20 flex items-center justify-center">
                                                            <span className="text-[#F7931A] font-bold">₿</span>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-400">{t('ai.btc_sentiment')}</div>
                                                            <div className="text-sm font-bold text-white">
                                                                ${(btcMarket.price || 0).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-lg font-bold ${(btcMarket.change24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {(btcMarket.change24h || 0) >= 0 ? '+' : ''}{(btcMarket.change24h || 0).toFixed(2)}%
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {Math.abs(btcMarket.change24h) < 0.5 ? '市场横盘震荡' : (btcMarket.change24h > 0 ? t('ai.bullish') : t('ai.bearish'))}
                                                        </div>
                                                    </div>
                                                </div>
                                                {(() => {
                                                    // 1. Calculate Best Pattern
                                                    const patternStats = {};
                                                    trades.forEach(t => {
                                                        const p = t.pattern || '未记录';
                                                        if (!patternStats[p]) patternStats[p] = { wins: 0, total: 0 };
                                                        patternStats[p].total++;
                                                        if (t.profitLoss > 0) patternStats[p].wins++;
                                                    });
                                                    let bestPattern = '数据不足';
                                                    let bestWinRate = 0;
                                                    Object.entries(patternStats).forEach(([pattern, stats]) => {
                                                        const rate = stats.wins / stats.total;
                                                        if (rate >= bestWinRate && stats.total >= 1) {
                                                            bestWinRate = rate;
                                                            bestPattern = pattern;
                                                        }
                                                    });

                                                    // 2. Calculate Worst Timeframe
                                                    const tfStats = {};
                                                    trades.forEach(t => {
                                                        const tf = t.timeframe || '未记录';
                                                        if (!tfStats[tf]) tfStats[tf] = { losses: 0, total: 0 };
                                                        tfStats[tf].total++;
                                                        if (t.profitLoss < 0) tfStats[tf].losses++;
                                                    });
                                                    let worstTimeframe = '数据不足';
                                                    let worstLossRate = -1;
                                                    Object.entries(tfStats).forEach(([tf, stats]) => {
                                                        const rate = stats.losses / stats.total;
                                                        if (rate > worstLossRate && stats.total >= 1) {
                                                            worstLossRate = rate;
                                                            worstTimeframe = tf;
                                                        }
                                                    });

                                                    // 3. Calculate Discipline Score
                                                    // Base 100, deduct for bad R:R, deduct for large losses
                                                    let score = 100;
                                                    if (trades.length > 0) {
                                                        const badRRTrades = trades.filter(t => (parseFloat(t.rrRatio) || 0) < 1.5).length;
                                                        score -= (badRRTrades / trades.length) * 30;

                                                        const losingTrades = trades.filter(t => t.profitLoss < 0);
                                                        const winningTrades = trades.filter(t => t.profitLoss > 0);

                                                        const avgLoss = losingTrades.length > 0
                                                            ? losingTrades.reduce((acc, t) => acc + Math.abs(t.profitLoss), 0) / losingTrades.length
                                                            : 0;
                                                        const avgWin = winningTrades.length > 0
                                                            ? winningTrades.reduce((acc, t) => acc + t.profitLoss, 0) / winningTrades.length
                                                            : 1; // Avoid division by zero if no wins

                                                        if (avgLoss > avgWin) score -= 20;
                                                    }

                                                    // 4. Review & PnL Check
                                                    const reviewedTrades = trades.filter(t => t.review && t.review.length > 5).length;
                                                    const reviewRate = trades.length > 0 ? reviewedTrades / trades.length : 0;
                                                    if (reviewRate < 0.5) score -= 10; // Deduct if less than 50% reviewed

                                                    const totalPnL = trades.reduce((acc, t) => acc + (t.profitLoss || 0), 0);

                                                    score = Math.max(0, Math.round(score));

                                                    return (
                                                        <>
                                                            <div className="grid grid-cols-3 gap-4 mb-6">
                                                                <div className="p-4 bg-neutral-800/50 rounded-xl text-center border border-neutral-700">
                                                                    <div className="text-xs text-gray-500 mb-1">{t('ai.best_pattern')}</div>
                                                                    <div className="text-lg font-bold text-green-400">{bestPattern}</div>
                                                                    <div className="text-xs text-gray-600 mt-1">{t('journal.win_rate')} {bestPattern !== '数据不足' ? (bestWinRate * 100).toFixed(0) : 0}%</div>
                                                                </div>
                                                                <div className="p-4 bg-neutral-800/50 rounded-xl text-center border border-neutral-700">
                                                                    <div className="text-xs text-gray-500 mb-1">{t('ai.worst_timeframe')}</div>
                                                                    <div className="text-lg font-bold text-red-400">{worstTimeframe}</div>
                                                                    <div className="text-xs text-gray-600 mt-1">{t('journal.status.loss')} {worstTimeframe !== '数据不足' ? (worstLossRate * 100).toFixed(0) : 0}%</div>
                                                                </div>
                                                                <div className="p-4 bg-neutral-800/50 rounded-xl text-center border border-neutral-700">
                                                                    <div className="text-xs text-gray-500 mb-1">{t('ai.discipline_score')}</div>
                                                                    <div className={`text-lg font-bold ${score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{score}/100</div>
                                                                    <div className="text-xs text-gray-600 mt-1">{score >= 80 ? t('ai.score_excellent') : score >= 60 ? t('ai.score_good') : t('ai.score_bad')}</div>
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
                                                                            {reviewRate < 0.5 && <span className="block text-amber-500 mt-1">⚠️ 您仅复盘了 {(reviewRate * 100).toFixed(0)}% 的交易。复盘是提升交易认知的关键！</span>}
                                                                            <span className={`block mt-1 font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                                当前总盈亏: {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USDT。
                                                                                {totalPnL < 0 ? ' 请暂停交易，检查是否在抗单或频繁止损。' : ' 保持良好的盈利节奏！'}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            {/* 资金曲线 */}
                                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                                                <h3 className="text-lg font-bold text-white mb-4">{t('ai.equity_curve')}</h3>
                                                <div className="h-[250px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={trades.slice().reverse().reduce((acc, t) => {
                                                            const lastVal = acc.length > 0 ? acc[acc.length - 1].val : 10000;
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
                                        </div>

                                        {/* 右侧：市场 AI 辅助 (保留功能) */}
                                        <div className="lg:col-span-1 space-y-6">
                                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                                                <h3 className="text-sm font-bold text-gray-400 mb-4">市场情绪辅助</h3>
                                                <div className="flex flex-col items-center justify-center py-4">
                                                    <div className="text-4xl font-black text-white mb-2">32</div>
                                                    <div className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded mb-4">恐慌 (Fear)</div>
                                                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-gradient-to-r from-red-500 to-yellow-500 w-[32%] h-full"></div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-4 text-center">
                                                    当市场恐慌时，正是您执行交易纪律的最佳时机。切勿追涨杀跌。
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* 支付弹窗 - 新版三种支付方式 */}
            {
                showPaymentModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                        <div className="bg-neutral-900 w-full max-w-2xl rounded-2xl border border-neutral-800 p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Crown className="w-32 h-32 text-amber-500" />
                            </div>
                            <h3 className="text-2xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent mb-2">{t('payment.title')}</h3>
                            <p className="text-gray-400 mb-8">{t('payment.subtitle')}</p>

                            <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white rounded-lg transition-all z-10">
                                <X className="w-5 h-5" />
                            </button>

                            {!paymentMethod ? (
                                <>
                                    {/* 选择支付方式 */}
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            {t('payment.method')}
                                        </h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            {/* USDT */}
                                            <button
                                                onClick={() => setPaymentMethod('usdt')}
                                                className="group relative p-6 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                                            >
                                                <div className="absolute top-2 right-2">
                                                    <div className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{t('payment.recommended')}</div>
                                                </div>
                                                <Wallet className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                                                <div className="text-xl font-black text-white mb-1">{t('payment.usdt')}</div>
                                                <div className="text-2xl font-black text-amber-500 mb-2">15.00</div>
                                                <div className="text-xs text-gray-500">{t('payment.crypto_payment')}</div>
                                            </button>

                                            {/* 美元 */}
                                            <a
                                                href={`https://goldencattrading.lemonsqueezy.com/buy/ddb38db6-1d3c-490d-9ad7-bb13684f70a6?checkout[custom][user_id]=${user?.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative p-6 rounded-2xl border-2 border-neutral-700 bg-neutral-800/50 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                                            >
                                                <DollarSign className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                                                <div className="text-xl font-black text-white mb-1">{t('payment.usd')}</div>
                                                <div className="text-2xl font-black text-blue-400 mb-2">$15.00</div>
                                                <div className="text-xs text-gray-500">{t('payment.card_paypal')}</div>
                                            </a>

                                            {/* 人民币 */}
                                            <button
                                                onClick={() => setPaymentMethod('cny')}
                                                className="group relative p-6 rounded-2xl border-2 border-neutral-700 bg-neutral-800/50 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20 transition-all"
                                            >
                                                <Coins className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                                <div className="text-xl font-black text-white mb-1">{t('payment.cny')}</div>
                                                <div className="text-2xl font-black text-green-400 mb-2">¥99.00</div>
                                                <div className="text-xs text-gray-500">{t('payment.alipay_wechat')}</div>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-neutral-800/50 rounded-xl border border-neutral-800">
                                        <Crown className="w-5 h-5 text-amber-500" />
                                        <div className="text-sm text-gray-400">
                                            {t('payment.unlimited')} · {t('payment.ai_analysis')} · {t('payment.badge')}
                                        </div>
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
                                                        alert(t('payment.copied'));
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
                                                        alert(t('payment.copied'));
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
                                                    alert(t('payment.txid_placeholder'));
                                                    return;
                                                }

                                                try {
                                                    // 创建或更新订单到 Supabase
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
                                                        alert(t('common.error') + ': ' + error.message);
                                                        return;
                                                    }

                                                    alert(t('common.success'));
                                                    setShowPaymentModal(false);
                                                    setPaymentTxId('');
                                                    setPaymentMethod(null);
                                                    setOrderNumber('');
                                                } catch (err) {
                                                    console.error('Unexpected error:', err);
                                                    alert(t('common.error'));
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
                                    {/* 人民币支付 - Xorpay (待接入) */}
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
                                <div className="font-bold text-sm tracking-wide">{t('common.success')}</div>
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
                        <div className="bg-neutral-900 w-full max-w-sm rounded-2xl border border-neutral-800 p-8 shadow-2xl">
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
                                    {!isRegisterMode && <span>{t('auth.demo_account')}: demo@goldcat.com / demo123</span>}
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
                            <h3 className="text-lg font-bold text-white mb-4">{t('journal.settle')}</h3>
                            <p className="text-xs text-gray-400 mb-4">{t('form.margin')}</p>
                            <input
                                type="number"
                                placeholder="例如: 50 或 -20"
                                value={closePnL}
                                onChange={e => setClosePnL(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none font-mono mb-6 text-lg"
                                autoFocus
                            />
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
                        <div className="bg-[#1A1D24] w-full max-w-lg rounded-2xl border border-neutral-800 p-6 shadow-2xl">
                            <h3 className="text-lg font-bold text-white mb-4">交易复盘</h3>
                            <p className="text-xs text-gray-400 mb-4">记录这笔交易的心得、教训或改进点。</p>
                            <textarea
                                value={reviewNote}
                                onChange={e => setReviewNote(e.target.value)}
                                className="w-full h-32 bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none mb-6 resize-none"
                                placeholder="在此输入复盘笔记..."
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-xl font-bold transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={saveReview}
                                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/20"
                                >
                                    保存复盘
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
                                <h3 className="text-lg font-bold text-white">管理交易形态</h3>
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
                                                    {t('settings.expires_on')}: {membership.expiryDate || '2099-12-31'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {!membership.isPremium && (
                                        <button
                                            onClick={() => { setShowSettingsModal(false); setPaymentMethod(null); setShowPaymentModal(true); }}
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
                                        <span>{t('fortune.title')} ({t('fortune.personalized')})</span>
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
                        </div >
                    </div >
                )
            }

            {/* Persistent Debug Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-neutral-800 p-2 text-[10px] font-mono text-gray-500 z-[9999] flex justify-between items-center notranslate">
                <div>
                    <span className="text-amber-500">DATA:</span> M:{formData.margin} L:{formData.leverage} E:{formData.entryPrice} S:{formData.stopLoss} T:{formData.takeProfit}
                </div>
                <div>
                    <span className="text-blue-500">CALC:</span> Pos:{riskAnalysis.positionSize} Risk%:{riskAnalysis.riskPercent} RR:{riskAnalysis.rrRatio} Valid:{riskAnalysis.valid ? 'Y' : 'N'}
                </div>
            </div>
        </div >
    );
}

// --- Sub-components ---

const FortuneCompass = ({ language, t, user, isPremium, onOpenSettings, onUpgrade }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [fortune, setFortune] = useState(null);
    const todayStr = new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setFortune(getDailyFortune(today, user?.birthDate));
    }, [user?.birthDate]);

    if (!fortune) return null;

    // Locked State for Non-Premium
    if (!isPremium) {
        return (
            <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f] border border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-xl group cursor-pointer mt-8" onClick={onUpgrade}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3 border border-neutral-700 group-hover:scale-110 transition-transform">
                        <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{t('fortune.title')}</h3>
                    <p className="text-xs text-amber-500 font-bold">{t('settings.upgrade_to_unlock')}</p>
                </div>
                {/* Blurred Content Preview */}
                <div className="opacity-20 blur-sm pointer-events-none flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Compass className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{t('fortune.title')}</h3>
                            <p className="text-xs text-gray-500">{todayStr}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f] border border-amber-900/30 rounded-2xl p-1 relative overflow-hidden shadow-2xl mt-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent"></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 border-[20px] border-amber-500/5 rounded-full"></div>
                <div className="absolute -left-10 -bottom-10 w-60 h-60 border-[40px] border-amber-500/5 rounded-full"></div>
            </div>

            <div className="relative z-10 bg-[#141414] rounded-xl p-4 md:p-6 transition-all duration-500">
                {!isOpen ? (
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => setIsOpen(true)}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 group-hover:rotate-180 transition-transform duration-700">
                                <Compass className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {t('fortune.title')}
                                    {user?.birthDate && <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t('fortune.personalized')}</span>}
                                </h3>
                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                    <span>{todayStr}</span>
                                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                    <span>{t('fortune.open_compass')}</span>
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-amber-500 transition-colors" />
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-2">
                                <Compass className="w-5 h-5 text-amber-500" />
                                <h3 className="text-lg font-bold text-amber-500">{t('fortune.title')}</h3>
                                <span className="text-xs text-gray-500 ml-2 font-mono">{todayStr}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {!user?.birthDate && (
                                    <button onClick={(e) => { e.stopPropagation(); onOpenSettings(); }} className="text-xs text-amber-500 hover:underline flex items-center gap-1 mr-2">
                                        <Sparkles className="w-3 h-3" /> {t('fortune.setup_birth')}
                                    </button>
                                )}
                                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Hexagram */}
                            <div className="col-span-1 md:col-span-1 flex flex-col items-center justify-center p-4 bg-neutral-900/50 rounded-xl border border-neutral-800 text-center relative overflow-hidden">
                                {user?.birthDate && <div className="absolute top-2 right-2 text-[10px] text-purple-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t('fortune.personalized')}</div>}
                                <div className="text-6xl font-black text-white mb-2 leading-none font-serif opacity-90">{fortune.hexagram.symbol}</div>
                                <div className="text-lg font-bold text-amber-500 mb-1">{fortune.hexagram.name[language]}</div>
                                <div className={`text-xs px-2 py-1 rounded-full mb-3 ${fortune.hexagram.type === 'bullish' ? 'bg-red-900/30 text-red-400 border-red-900/50' : fortune.hexagram.type === 'bearish' ? 'bg-green-900/30 text-green-400 border-green-900/50' : 'bg-gray-800 text-gray-400'}`}>
                                    {fortune.hexagram.meaning[language]}
                                </div>
                            </div>

                            {/* Almanac */}
                            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-lg border border-neutral-800">
                                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold border border-red-500/20 text-xs">
                                            {t('fortune.suit')}
                                        </div>
                                        <div className="font-bold text-white">{fortune.suit[language]}</div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-lg border border-neutral-800">
                                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold border border-green-500/20 text-xs">
                                            {t('fortune.avoid')}
                                        </div>
                                        <div className="font-bold text-white">{fortune.avoid[language]}</div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg border border-neutral-800">
                                        <span className="text-xs text-gray-500">{t('fortune.lucky_direction')}</span>
                                        <span className="font-bold text-amber-500">{t(`fortune.directions.${fortune.direction}`)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg border border-neutral-800">
                                        <span className="text-xs text-gray-500">{t('fortune.lucky_color')}</span>
                                        <span className="font-bold text-white">{t(`fortune.colors.${fortune.color}`)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoldCatApp;
