import { supabase } from '../../../../supabaseClient';
import { detectDivergence } from '../indicators';

export async function consultObserver(
    symbol,
    data1m,
    data5m,
    data1h,
    extraMetrics = { tacticalSignals: [] },
    lang = 'zh'
) {
    const isEn = lang === 'en';

    // Metric Helper
    const analyzeDimension = (data) => {
        if (data.length < 2) return { change: 0, trend: 'FLAT', rsi: 50, volTrend: 'FLAT', divergence: 'NONE' };

        const start = data[0].v;
        const end = data[data.length - 1].v;
        const change = ((end - start) / start) * 100;

        const currentRSI = data[data.length - 1].rsi || 50;
        const mid = Math.floor(data.length / 2);
        const vol1 = data.slice(0, mid).reduce((a, b) => a + b.vol, 0) / mid;
        const vol2 = data.slice(mid).reduce((a, b) => a + b.vol, 0) / (data.length - mid);
        const volChange = vol2 - vol1;

        return {
            change: change.toFixed(2),
            trend: change > 0.05 ? "UP" : change < -0.05 ? "DOWN" : "FLAT",
            rsi: currentRSI.toFixed(1),
            volTrend: volChange > 0 ? "EXPANDING" : "CONTRACTING",
            divergence: detectDivergence(data)
        };
    };

    const dim1h = analyzeDimension(data1h);
    const dim5m = analyzeDimension(data5m);
    const dim1m = analyzeDimension(data1m);

    // Parse Tactical Signals (Check 15m, 1h, 4h ONLY)
    const validTimeframes = ['15m', '1h', '4h'];

    const fbgSignals = extraMetrics.tacticalSignals
        .filter(s => s.type === 'FLAT_BOTTOM_GREEN' && validTimeframes.includes(s.timeframe))
        .map(s => s.timeframe);

    const brSignals = extraMetrics.tacticalSignals
        .filter(s => s.type === 'BEHEADING_RED' && validTimeframes.includes(s.timeframe))
        .map(s => s.timeframe);

    const tacticalReport = [];
    if (fbgSignals.length > 0) tacticalReport.push(`[STRONG BULLISH SIGNAL DETECTED ON: ${fbgSignals.join(', ')}]`);
    if (brSignals.length > 0) tacticalReport.push(`[STRONG BEARISH SIGNAL DETECTED ON: ${brSignals.join(', ')}]`);

    const tacticalContext = tacticalReport.length > 0 ? tacticalReport.join(' AND ') : "NO SPECIAL PATTERNS";

    const systemInstructionZH = `
    你扮演“GoldCat 量子观察者 (Quantum Observer)”，基于量子力学隐喻分析加密市场。

    你有两套独立的观测系统：
    1. **量子共振系统 (Resonance)**: 基于 1H/5M/1M 的趋势和指标共振。
    2. **战术形态系统 (Tactical)**: 监测核心大级别周期 (15M/1H/4H) 的高胜率K线组合。

    【输入数据】
    Target: ${symbol}
    1. 1H (宏观): Trend ${dim1h.trend}, RSI ${dim1h.rsi}, Change ${dim1h.change}%
    2. 5M (结构): Trend ${dim5m.trend}, Divergence ${dim5m.divergence}
    3. 1M (微观): Trend ${dim1m.trend}, Volatility ${dim1m.volTrend}
    4. **独立战术警报**: ${tacticalContext}

    【任务】
    综合分析。
    - 如果“战术警报”显示 **STRONG BULLISH SIGNAL**，请给予极高的做多权重，输出信号 LONG。
    - 如果“战术警报”显示 **STRONG BEARISH SIGNAL**，请给予极高的做空权重，输出信号 SHORT。
    - 如果同时存在，或都不存在，则依赖共振系统分析。
    
    【重要】
    不要提及具体的形态名称（如“平底绿”、“砍头红”等），直接给出操作建议。
    即使数据不够完美，你也**必须**基于现有 1H/5M 数据估算一个最合理的【下方支撑位】和【上方阻力位】价格，绝对不能返回 0 或 null。参考最近的 RSI 极值或价格波动范围。

    必须返回标准 JSON 格式，不包含 markdown 代码块：
    {
      "probability_up": number (0-100),
      "uncertainty": number (0-100),
      "conclusion": string (简短结论，中文),
      "quantum_phrase": string (中文或双语科幻术语),
      "signal": "LONG" | "SHORT" | "WAIT",
      "action_advice": string (操作建议，中文，直接给出具体的进场或观望建议),
      "support_price": number (必须返回数值。基于当前价格估算的下方关键支撑位，不能为0),
      "resistance_price": number (必须返回数值。基于当前价格估算的上方关键阻力位，不能为0)
    }
  `;

    const systemInstructionEN = `
    You act as "GoldCat Quantum Observer", analyzing crypto markets with quantum mechanics metaphors.

    You have two independent observation systems:
    1. **Resonance System**: Based on 1H/5M/1M trend and indicator resonance.
    2. **Tactical System**: Monitors core timeframe (15M/1H/4H) high-win-rate candlestick patterns.

    [Input Data]
    Target: ${symbol}
    1. 1H (Macro): Trend ${dim1h.trend}, RSI ${dim1h.rsi}, Change ${dim1h.change}%
    2. 5M (Structure): Trend ${dim5m.trend}, Divergence ${dim5m.divergence}
    3. 1M (Micro): Trend ${dim1m.trend}, Volatility ${dim1m.volTrend}
    4. **Tactical Alerts**: ${tacticalContext}

    [Task]
    Analyze comprehensively.
    - If "Tactical Alerts" show **STRONG BULLISH SIGNAL**, give extremely high weight to LONG.
    - If "Tactical Alerts" show **STRONG BEARISH SIGNAL**, give extremely high weight to SHORT.
    - Otherwise, rely on resonance analysis.

    [Important]
    Do not mention specific pattern names. Directly give actionable advice.
    You **MUST** estimate a reasonable [Support Level] and [Resistance Level] based on the provided 1H/5M data, even if theoretical. DO NOT return 0 or null. Use recent price range or RSI extremes as reference.

    Must return standard JSON format, no markdown code blocks:
    {
      "probability_up": number (0-100),
      "uncertainty": number (0-100),
      "conclusion": string (Short conclusion in English),
      "quantum_phrase": string (Sci-fi term in English),
      "signal": "LONG" | "SHORT" | "WAIT",
      "action_advice": string (Action advice in English, specific entry or wait advice),
      "support_price": number (MUST BE A NUMBER > 0. Estimated key support level),
      "resistance_price": number (MUST BE A NUMBER > 0. Estimated key resistance level)
    }
  `;

    const promptText = isEn
        ? `${systemInstructionEN}\n\nAnalyze ${symbol}'s quantum state immediately and output JSON.`
        : `${systemInstructionZH}\n\n立即分析 ${symbol} 的量子场态并输出 JSON。`;

    try {
        console.log(`[Quantum Observer] Invoking AI Proxy...`);

        // Use Supabase Edge Function 'ai-proxy'
        // CRITICAL FIX: Explicitly pass Anon Key for non-logged-in users
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: { prompt: promptText }
        });

        if (error) {
            console.error('[Quantum Observer] Proxy Error:', error);

            // Check for Custom 429 (Daily Limit)
            // Supabase functions.invoke wraps the response. 
            // If the function returned 429, error will be populated or we need to check context.
            // Actually supabase-js handles non-2xx as error usually.

            // If the error object has details we can check.
            // But if it's a "Daily Limit Reached" JSON from our function, Supabase might parse it?
            // Actually supabase invoke returns { data, error }. If status is 4xx, error is set.

            // Let's assume we can detect the limit message.
            try {
                // Debug: Log full error details
                console.log("[Quantum Debug] Error Object:", error);
                if (error && error.context && typeof error.context.json === 'function') {
                    error.context.json().then(j => console.log("[Quantum Debug] Error Body:", j));
                } else if (error && error.message) {
                    console.log("[Quantum Debug] Error Message:", error.message);
                }

                // If it's a 429, we assume Limit.
                // The error object typically contains 'context' or 'status'.
                const status = (error && (error.status || (error.context && error.context.status)));
                if (status === 429) {
                    return {
                        probability_up: 0,
                        uncertainty: 0,
                        conclusion: isEn ? "DAILY SCAN LIMIT REACHED." : "今日扫描次数已耗尽。",
                        quantum_phrase: "LIMIT_EXCEEDED",
                        signal: "WAIT",
                        action_advice: isEn ? "Please upgrade to PRO for more scans." : "请升级 PRO 会员解锁无限扫描。",
                        support_price: 0,
                        resistance_price: 0,
                        deja_vu: 0,
                        resonance: 0,
                        entropy: 100
                    };
                }
            } catch (e) {
                // ignore
            }

            throw error;
        }

        // Parse AI Result
        const text = data.text;
        if (!text) throw new Error('Empty response from AI Proxy');

        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        let result;

        if (jsonMatch) {
            try {
                result = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.warn("Extracted JSON Parse Failed", e);
            }
        }

        if (!result) {
            console.warn("JSON Parse Failed, raw text:", text);
            return {
                probability_up: 50,
                uncertainty: 50,
                conclusion: text.slice(0, 200) + (text.length > 200 ? "..." : ""),
                quantum_phrase: "TEXT_RESPONSE_RECEIVED",
                signal: "WAIT",
                action_advice: isEn ? "AI returned a plain text report." : "AI 提供了纯文本分析报告。",
                support_price: 0,
                resistance_price: 0,
                deja_vu: 0,
                resonance: 0,
                entropy: 50
            };
        }

        if (result) {
            console.log("[Quantum Observer] Parsed AI Result:", result);
        }

        // --- NEW: Strict Prompt Parsing ---
        // Ensure support/resistance are numbers, even if AI returns "2000" string or undefined
        let support = parseFloat(result.support_price);
        let resistance = parseFloat(result.resistance_price);

        // If NaN (failed trace), default to 0
        if (isNaN(support)) support = 0;
        if (isNaN(resistance)) resistance = 0;

        return {
            probability_up: result.probability_up ?? 50,
            uncertainty: result.uncertainty ?? 50,
            conclusion: result.conclusion || (isEn ? "Market in superposition." : "市场处于叠加态。"),
            quantum_phrase: result.quantum_phrase || "QUANTUM_FLUX",
            signal: result.signal || "WAIT",
            action_advice: result.action_advice || (isEn ? "Wait for wave collapse." : "等待波函数坍缩。"),
            support_price: support,
            resistance_price: resistance,
            // Calculate quantum metrics based on multi-timeframe analysis
            deja_vu: Math.min(100, Math.abs(dim1h.rsi - 50) * 2), // Pattern recognition strength
            resonance: Math.min(100, (
                (dim1h.trend === dim5m.trend ? 33 : 0) +
                (dim5m.trend === dim1m.trend ? 33 : 0) +
                (dim1h.trend === dim1m.trend ? 34 : 0)
            )), // Trend alignment across timeframes
            entropy: Math.min(100, result.uncertainty ?? 50) // Market chaos level
        };

    } catch (e) {
        console.error("Observer Failed:", e);
        // Distinguish network error from limit error if possible
        const isLimit = e && (e.message?.includes('429') || e.status === 429);

        if (isLimit) {
            return {
                probability_up: 0,
                uncertainty: 0,
                conclusion: isEn ? "DAILY SCAN LIMIT REACHED." : "今日扫描次数已耗尽。",
                quantum_phrase: "LIMIT_EXCEEDED",
                signal: "WAIT",
                action_advice: isEn ? "Please upgrade to PRO." : "请升级 PRO 会员。",
                support_price: 0,
                resistance_price: 0,
                deja_vu: 0,
                resonance: 0,
                entropy: 100
            };
        }

        return {
            probability_up: 50,
            uncertainty: 100,
            conclusion: isEn ? "Connection Failed." : "连接失败，请重试。",
            quantum_phrase: "QUANTUM_DECOHERENCE",
            signal: "WAIT",
            action_advice: isEn ? "Please check network." : "请检查网络连接。",
            support_price: 0,
            resistance_price: 0,
            deja_vu: 0,
            resonance: 0,
            entropy: 100
        };
    }
}

