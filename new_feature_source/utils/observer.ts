import { GoogleGenAI } from "@google/genai";
import { AIAnalysisResult, ChartData, TacticalSignal } from '../types';
import { detectDivergence } from './indicators';

export async function consultObserver(
  symbol: string,
  data1m: ChartData[], 
  data5m: ChartData[],
  data1h: ChartData[],
  extraMetrics: { tacticalSignals: TacticalSignal[] } = { tacticalSignals: [] }
): Promise<AIAnalysisResult> {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Metric Helper
  const analyzeDimension = (data: ChartData[]) => {
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

  // Parse Tactical Signals
  const fbgSignals = extraMetrics.tacticalSignals
    .filter(s => s.type === 'FLAT_BOTTOM_GREEN')
    .map(s => s.timeframe);
    
  const brSignals = extraMetrics.tacticalSignals
    .filter(s => s.type === 'BEHEADING_RED')
    .map(s => s.timeframe);

  const tacticalReport = [];
  if (fbgSignals.length > 0) tacticalReport.push(`[平底绿 (LONG) FOUND ON: ${fbgSignals.join(', ')}]`);
  if (brSignals.length > 0) tacticalReport.push(`[砍头红 (SHORT) FOUND ON: ${brSignals.join(', ')}]`);
  
  const tacticalContext = tacticalReport.length > 0 ? tacticalReport.join(' AND ') : "NO SPECIAL PATTERNS";

  const systemInstruction = `
    你扮演“GoldCat 量子观察者 (Quantum Observer)”，基于量子力学隐喻分析加密市场。

    你有两套独立的观测系统：
    1. **量子共振系统 (Resonance)**: 基于 1H/5M/1M 的趋势和指标共振。
    2. **战术形态系统 (Tactical)**: 监测特定的高胜率K线组合。

    【核心形态定义】
    - **平底绿 (Flat Bottom Green)**: 看涨形态 (LONG)。
    - **砍头红 (Beheading Red)**: 看空形态 (SHORT)。十字星后紧接大阴线，无上影线，跌破支撑。

    【输入数据】
    Target: ${symbol}
    1. 1H (宏观): Trend ${dim1h.trend}, RSI ${dim1h.rsi}, Change ${dim1h.change}%
    2. 5M (结构): Trend ${dim5m.trend}, Divergence ${dim5m.divergence}
    3. 1M (微观): Trend ${dim1m.trend}, Volatility ${dim1m.volTrend}
    4. **独立战术警报**: ${tacticalContext}

    【任务】
    综合分析。
    - 如果“战术警报”显示 **平底绿**，请给予极高的做多权重，输出信号 LONG。
    - 如果“战术警报”显示 **砍头红**，请给予极高的做空权重，输出信号 SHORT。
    - 如果同时存在（罕见），或都不存在，则依赖共振系统分析。
    
    必须返回标准 JSON 格式，不包含 markdown 代码块：
    {
      "probability_up": number (0-100),
      "uncertainty": number (0-100),
      "conclusion": string (简短结论),
      "quantum_phrase": string (中文或双语科幻术语),
      "signal": "LONG" | "SHORT" | "WAIT",
      "action_advice": string (操作建议)
    }
  `;

  const prompt = `立即分析 ${symbol} 的量子场态并输出 JSON。`;

  try {
    // 使用目前最稳定的 gemini-2.0-flash，解决 404 问题
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      const text = response.text.trim();
      // Simple cleanup if model adds markdown
      const jsonStr = text.replace(/^```json/, '').replace(/```$/, '');
      const result = JSON.parse(jsonStr) as AIAnalysisResult;
      
      return {
        probability_up: result.probability_up ?? 50,
        uncertainty: result.uncertainty ?? 50,
        conclusion: result.conclusion || "市场处于叠加态，未检测到明确方向。",
        quantum_phrase: result.quantum_phrase || "QUANTUM_FLUX_DETECTED",
        signal: result.signal || "WAIT",
        action_advice: result.action_advice || "保持观察，等待波函数坍缩。"
      };
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("Observer Error (Full):", error);
    
    // Check for 404 specifically
    const errString = String(error);
    const isNotFound = errString.includes("404") || errString.includes("NOT_FOUND");
    
    // Fallback error message
    let failConclusion = "量子链路退相干。";
    if (isNotFound) {
        failConclusion = "模型版本不可用 (404)。请检查 API 支持的模型。";
    }

    return {
      probability_up: 50,
      uncertainty: 100,
      conclusion: failConclusion,
      quantum_phrase: "DECOHERENCE",
      signal: "WAIT",
      action_advice: "建议：检查代码中的 model 名称是否为您的 API Key 所支持。"
    };
  }
}