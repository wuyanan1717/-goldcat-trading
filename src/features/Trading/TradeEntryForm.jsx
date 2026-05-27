import React, { useState, useEffect, useMemo } from 'react';
import { Target, Search, Settings, AlertTriangle, TrendingDown, Lock, Shield, Edit3, Check, Activity, Crown, X, PlusCircle, Loader2, Upload, AlertCircle, Image as ImageIcon, FileText } from 'lucide-react';
import { calculateRisk, analyzeTradingPairRisk } from './utils/riskUtils';
import { analyzeTradeScreenshot } from './utils/ocrUtils';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

export default function TradeEntryForm({
    t,
    language,
    user,
    membership,
    trades,
    btcMarket,
    totalCapital,
    setTotalCapital,
    accountRiskLimit,
    setAccountRiskLimit,
    handleSaveCapital,
    patterns,
    onManagePatterns,
    onRequireLogin,
    onRequireUpgrade,
    onSubmit,
    isSubmitting,
    autoFillData,
    onAutoFillApplied,
    onShowSuccess,
    onShowError
}) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [isOcrDragging, setIsOcrDragging] = useState(false);
    const [formData, setFormData] = useState({
        tradeType: 'buy',
        symbol: '',
        margin: '',
        leverage: '10',
        entryPrice: '',
        stopLoss: '',
        takeProfit: '',
        pattern: patterns[0] || '',
        timeframe: '4h',
        review: ''
    });

    // Handle auto-fill from parent
    useEffect(() => {
        if (autoFillData) {
            setFormData(prev => ({
                ...prev,
                symbol: autoFillData.symbol || prev.symbol,
                tradeType: autoFillData.side ? (autoFillData.side === 'BUY' ? 'buy' : 'sell') : prev.tradeType,
                entryPrice: autoFillData.price ? autoFillData.price.toString() : prev.entryPrice,
                stopLoss: autoFillData.stopLoss ? autoFillData.stopLoss.toString() : prev.stopLoss,
                takeProfit: autoFillData.takeProfit ? autoFillData.takeProfit.toString() : prev.takeProfit,
            }));
            onAutoFillApplied();
        }
    }, [autoFillData, onAutoFillApplied]);

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
    
    const [tradeImage, setTradeImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    const [isEditingCapital, setIsEditingCapital] = useState(false);

    // Update risk analysis whenever form data or total capital changes
    useEffect(() => {
        const { analysis, errors } = calculateRisk(formData, totalCapital, t);
        setRiskAnalysis(analysis);
        setValidationErrors(errors);
    }, [formData, totalCapital, t]);

    // Keep pattern selection valid if patterns list changes
    useEffect(() => {
        if (!patterns.includes(formData.pattern)) {
            setFormData(prev => ({ ...prev, pattern: patterns[0] || '' }));
        }
    }, [patterns]);

    const tradingPairRisk = useMemo(() => {
        return analyzeTradingPairRisk(formData.symbol, trades);
    }, [formData.symbol, trades]);

    const handleInputChange = (field, value) => {
        if (['margin', 'leverage', 'entryPrice', 'stopLoss', 'takeProfit'].includes(field)) {
            const sanitized = value.replace(/[^\d.]/g, '');
            const parts = sanitized.split('.');
            const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
            setFormData(prev => ({ ...prev, [field]: finalValue }));
            return;
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageSelect = (e) => {
        if (!e.target.files || e.target.files.length === 0) {
            setTradeImage(null);
            setImagePreview(null);
            return;
        }

        const file = e.target.files[0];
        setTradeImage(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const processOcrFile = async (file) => {
        if (!file) return;
        setIsOcrLoading(true);
        try {
            const result = await analyzeTradeScreenshot(file);
            if (result.success && result.data) {
                const { symbol, direction, entryPrice, stopLoss, takeProfit, margin, leverage } = result.data;
                setFormData(prev => ({
                    ...prev,
                    symbol: symbol || prev.symbol,
                    tradeType: direction === 'sell' ? 'sell' : 'buy',
                    entryPrice: entryPrice || prev.entryPrice,
                    stopLoss: stopLoss || prev.stopLoss,
                    takeProfit: takeProfit || prev.takeProfit,
                    margin: margin || prev.margin,
                    leverage: leverage || prev.leverage
                }));
                if (onShowSuccess) onShowSuccess(t('common.auto_fill_success') || 'AI 分析成功！已填充识别到的数据。');
            } else {
                if (onShowError) onShowError(`AI 分析失败: ${result.error}`);
            }
        } catch (error) {
            console.error('OCR Upload Error:', error);
            if (onShowError) onShowError(`上传错误: ${error.message}`);
        } finally {
            setIsOcrLoading(false);
        }
    };

    const handleOcrUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await processOcrFile(file);
        }
        e.target.value = '';
    };

    const handleOcrDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOcrDragging(true);
    };

    const handleOcrDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOcrDragging(false);
    };

    const handleOcrDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOcrDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                await processOcrFile(file);
            }
        }
    };

    const handleSubmit = () => {
        if (!user) {
            onRequireLogin();
            return;
        }

        if (!membership.isPremium && trades.length >= membership.maxTrades) {
            onRequireUpgrade();
            return;
        }

        if (!formData.symbol || !formData.entryPrice || !formData.margin) {
            alert("【交易纪律】请完整填写交易要素，不可遗漏。");
            return;
        }

        if (!riskAnalysis.valid) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }

        onSubmit(formData, riskAnalysis, tradeImage);
    };

    // Derived variables for warnings
    const showEntryWarnings = formData.entryPrice && formData.stopLoss && formData.margin;
    let slPercent = 0, predictedLoss = 0, levelText = '', levelColor = '', levelBg = '';

    if (showEntryWarnings) {
        slPercent = Math.abs((parseFloat(formData.stopLoss) - parseFloat(formData.entryPrice)) / parseFloat(formData.entryPrice) * 100);
        predictedLoss = Math.abs((parseFloat(formData.stopLoss) - parseFloat(formData.entryPrice)) / parseFloat(formData.entryPrice) * parseFloat(formData.margin) * parseFloat(formData.leverage));
        if (slPercent < 1) {
            levelText = t('form.sl_level.too_tight');
            levelColor = 'text-yellow-500';
            levelBg = 'bg-yellow-500/10 border-yellow-500/30';
        } else if (slPercent <= 2) {
            levelText = t('form.sl_level.short_term');
            levelColor = 'text-cyan-400';
            levelBg = 'bg-cyan-500/10 border-cyan-500/30';
        } else if (slPercent <= 5) {
            levelText = t('form.sl_level.structure');
            levelColor = 'text-amber-400';
            levelBg = 'bg-amber-500/10 border-amber-500/30';
        } else if (slPercent <= 12) {
            levelText = t('form.sl_level.trend');
            levelColor = 'text-purple-400';
            levelBg = 'bg-purple-500/10 border-purple-500/30';
        } else {
            levelText = t('form.sl_level.too_wide');
            levelColor = 'text-red-500';
            levelBg = 'bg-red-500/10 border-red-500/30';
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {/* 左侧：录入表单 */}
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-neutral-800 pb-3 sm:pb-4">
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-amber-500" />
                        {t('form.title')}
                    </h2>
                    <div className="flex items-center gap-3">
                        {/* Auto-Fill OCR Button with Drag and Drop Support */}
                        <div 
                            className={`relative group ${isOcrDragging ? 'scale-105' : ''} transition-transform duration-200`}
                            onDragOver={handleOcrDragOver}
                            onDragLeave={handleOcrDragLeave}
                            onDrop={handleOcrDrop}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleOcrUpload}
                                disabled={isOcrLoading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                            />
                            <button
                                disabled={isOcrLoading}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg ${
                                    isOcrLoading 
                                        ? 'bg-amber-500/20 text-amber-500 pointer-events-none border-transparent' 
                                        : isOcrDragging 
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                            : 'bg-gradient-to-r from-neutral-800 to-neutral-800/80 hover:from-amber-500 hover:to-amber-400 hover:text-black text-amber-500 border border-amber-500/30 font-mono shadow-amber-500/10'
                                }`}
                            >
                                {isOcrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                {isOcrLoading ? (t('common.processing') || '识别中...') : (t('common.smart_scan') || '交割单识别')}
                            </button>
                            
                            {/* Dragging Feedback Overlay */}
                            {isOcrDragging && (
                                <div className="absolute inset-0 z-20 pointer-events-none rounded-lg ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-900 overflow-hidden flex items-center justify-center bg-amber-500/10 backdrop-blur-sm">
                                    <span className="text-amber-400 font-bold text-[10px]">DROP HERE</span>
                                </div>
                            )}
                        </div>
                        <span className="text-xs bg-neutral-800 text-gray-400 px-2 py-1 rounded hidden sm:inline-block">
                            {t('form.today_trade_count', { count: trades.filter(tr => tr.date === new Date().toLocaleDateString()).length + 1 })}
                        </span>
                    </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
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
                            <div className="relative group">
                                <div className="absolute left-3 top-3 pointer-events-none text-gray-500 z-10">
                                    <Search className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    lang="en"
                                    spellCheck="false"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="characters"
                                    placeholder="BTC"
                                    value={formData.symbol}
                                    onChange={e => {
                                        const val = e.target.value.toUpperCase();
                                        handleInputChange('symbol', val);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => {
                                        let val = formData.symbol.trim();
                                        if (val && !val.includes('/') && val.length < 10) {
                                            const common = ['USDT', 'USD', 'BTC', 'ETH'];
                                            if (!common.some(c => val.endsWith(c))) {
                                                val = val + '/USDT';
                                                handleInputChange('symbol', val);
                                            }
                                        }
                                        setTimeout(() => setShowSuggestions(false), 200);
                                    }}
                                    className="w-full min-h-[44px] bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-3 py-2.5 text-white focus:border-amber-500 focus:outline-none font-mono uppercase"
                                />
                                {showSuggestions && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                        {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'DOGE/USDT', 'PEPE/USDT', 'SUI/USDT', 'XRP/USDT', 'BNB/USDT', 'ADA/USDT', 'LINK/USDT', 'AVAX/USDT', 'DOT/USDT', 'MATIC/USDT', 'LTC/USDT', 'UNI/USDT']
                                            .filter(pair => !formData.symbol || pair.includes(formData.symbol))
                                            .map(pair => (
                                                <div
                                                    key={pair}
                                                    className="px-4 py-3 hover:bg-neutral-800 cursor-pointer text-sm font-mono text-gray-300 hover:text-white transition-colors border-b border-neutral-800/50 last:border-0"
                                                    onClick={() => {
                                                        handleInputChange('symbol', pair);
                                                        setShowSuggestions(false);
                                                    }}
                                                >
                                                    {pair}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs text-gray-500 mb-1.5">{t('form.timeframe')}</label>
                            <select
                                value={formData.timeframe}
                                onChange={e => handleInputChange('timeframe', e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none appearance-none"
                            >
                                {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs text-gray-500">{t('form.pattern')}</label>
                                <button onClick={onManagePatterns} className="text-[10px] text-amber-500 hover:underline flex items-center gap-1">
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                            {showEntryWarnings && (
                                <div className="mt-1.5 space-y-1">
                                    <div className="text-[10px] text-gray-500">
                                        {t('form.predicted_loss')}: <span className="text-red-500">${predictedLoss.toFixed(2)}</span>
                                    </div>
                                    <div className={`text-[10px] px-2 py-0.5 rounded border inline-flex items-center gap-1.5 ${levelBg}`}>
                                        <span className="text-gray-400">{t('form.sl_level.current')}:</span>
                                        <span className={`font-bold ${levelColor}`}>{slPercent.toFixed(1)}%</span>
                                        <span className="text-gray-500">→</span>
                                        <span className={`font-medium ${levelColor}`}>{levelText}</span>
                                    </div>
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
                                    {t('form.predicted_profit')}: <span className="text-green-500">
                                        ${Math.abs(((parseFloat(formData.takeProfit) - parseFloat(formData.entryPrice)) / parseFloat(formData.entryPrice) * parseFloat(formData.margin) * parseFloat(formData.leverage))).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Image Upload Area */}
                    <div className="mb-4">
                        <label className="block text-xs text-gray-500 mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> {t('form.image_upload') || 'Chart Screenshot'}
                            </span>
                            {!membership.isPremium && <span className="text-[10px] text-amber-500 flex items-center gap-1"><Crown className="w-3 h-3" /> Premium</span>}
                        </label>

                        {membership.isPremium ? (
                            <div className="relative group">
                                {imagePreview ? (
                                    <div className="relative rounded-lg overflow-hidden border border-neutral-700 bg-black/50">
                                        <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTradeImage(null);
                                                setImagePreview(null);
                                            }}
                                            className="absolute top-2 right-2 p-1 bg-black/70 text-white rounded-full hover:bg-red-500 transition-colors z-10"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="w-full h-24 border-2 border-dashed border-neutral-700 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 group-hover:border-amber-500/50 group-hover:text-amber-500/80 transition-all bg-neutral-800/30">
                                            <Upload className="w-6 h-6" />
                                            <span className="text-xs">{t('common.upload_hint') || 'Click or Drag to Upload'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                onClick={onRequireUpgrade}
                                className="w-full h-24 border border-neutral-800 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-600 bg-neutral-900/50 cursor-pointer hover:bg-neutral-800 transition-colors relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-5"></div>
                                <Lock className="w-5 h-5" />
                                <span className="text-xs">{t('form.unlock_upload') || 'Upgrade to upload charts'}</span>
                            </div>
                        )}
                    </div>

                    {/* Review Notes Area */}
                    <div className="mb-6 animate-in fade-in slide-in-from-bottom-2">
                        <label className="block text-xs text-gray-500 mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> {t('form.review_note') || 'Review (Optional)'}
                            </span>
                        </label>
                        <textarea
                            value={formData.review || ''}
                            onChange={(e) => handleInputChange('review', e.target.value)}
                            placeholder={t('journal.review_placeholder') || 'Enter review notes here...'}
                            className="w-full h-24 bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-sm text-gray-300 focus:border-amber-500 focus:outline-none resize-none notranslate"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        {!membership.isPremium && trades.length >= membership.maxTrades ? (
                            <button disabled className="w-full py-4 bg-neutral-800 border border-neutral-700 text-gray-500 font-bold rounded-xl cursor-not-allowed flex flex-col items-center justify-center gap-1">
                                <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> {t('form.quota_full')}</span>
                                <span className="text-xs font-normal">{t('form.quota_desc')}</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className={`w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-lg ${isShaking ? 'animate-shake' : ''} ${!riskAnalysis.valid ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PlusCircle className="w-5 h-5" /> {t('form.submit_btn')}</>}
                            </button>
                        )}
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
                                <button onClick={() => {
                                    setTotalCapital(Math.round(totalCapital));
                                    setIsEditingCapital(true);
                                }} className="text-amber-500 hover:text-amber-400">
                                    <Edit3 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        {isEditingCapital ? (
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 w-16">资金($):</span>
                                    <input
                                        type="number"
                                        step="1"
                                        value={totalCapital}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || val === '-') {
                                                setTotalCapital('');
                                            } else {
                                                const parsed = parseInt(val);
                                                setTotalCapital(isNaN(parsed) ? 0 : parsed);
                                            }
                                        }}
                                        className="flex-1 bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-sm text-white font-mono"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 w-16">风控(%):</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={accountRiskLimit}
                                        onChange={(e) => setAccountRiskLimit(e.target.value)}
                                        className="flex-1 bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-sm text-white font-mono"
                                    />
                                </div>
                                <button onClick={() => {
                                    setIsEditingCapital(false);
                                    handleSaveCapital();
                                }} className="w-full bg-green-600 hover:bg-green-500 text-white px-2 py-1.5 rounded text-xs font-bold mt-1">保存设置</button>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <div className="text-xl font-black font-mono text-white tracking-wider">
                                    ${(totalCapital || 0).toLocaleString()}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    账户风控红线: <span className="text-amber-500 font-bold">{accountRiskLimit}%</span>
                                </div>
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

                        {riskAnalysis.accountRiskPercent > accountRiskLimit && (
                            <div className={`flex gap-2 p-3 border rounded-lg ${riskAnalysis.accountRiskPercent > (accountRiskLimit * 1.5) ? 'bg-red-900/20 border-red-900/50' : 'bg-yellow-900/20 border-yellow-900/50'}`}>
                                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${riskAnalysis.accountRiskPercent > (accountRiskLimit * 1.5) ? 'text-red-500' : 'text-yellow-500'}`} />
                                <div className="text-xs leading-relaxed">
                                    <p className={`font-bold ${riskAnalysis.accountRiskPercent > (accountRiskLimit * 1.5) ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {riskAnalysis.accountRiskPercent > (accountRiskLimit * 1.5) ? '危险警告 (DANGER)' : '风险提示 (WARNING)'}
                                    </p>
                                    <p className="text-gray-400">
                                        当前账户风险为 {riskAnalysis.accountRiskPercent}%，
                                        {riskAnalysis.accountRiskPercent > (accountRiskLimit * 1.5) ? `严重超出设定阈值 (>${(accountRiskLimit * 1.5).toFixed(1)}%)！建议大幅降低仓位。` : `已超出设定阈值 (${accountRiskLimit}%)，请谨慎操作。`}
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
                                {((btcMarket.change24h || 0) > 0) ? '+' : ''}{(btcMarket.change24h || 0).toFixed(2)}%
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
    );
}
