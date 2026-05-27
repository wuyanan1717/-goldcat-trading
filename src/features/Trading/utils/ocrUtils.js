import { supabase } from '../../../supabaseClient';

export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

export const analyzeTradeScreenshot = async (file) => {
    try {
        const base64DataUrl = await fileToBase64(file);
        // Extracts type and base64 string
        const [metaData, base64String] = base64DataUrl.split(',');
        const mimeType = metaData.match(/:(.*?);/)[1];

        const promptText = `
You are an expert trading assistant. I am providing you with a screenshot of a cryptocurrency or stock trading "delivery slip" (order execution/position screenshot).
Please extract the following information and output it in a strict JSON format. 

Extract these fields:
- "symbol": The trading pair or stock symbol (e.g., "BTC/USDT", "ETH/USDT"). If it's just BTC, format as "BTC/USDT". Ensure it's uppercase.
- "direction": "buy" for Long/Buy/做多 positions, "sell" for Short/Sell/做空 positions.
- "entryPrice": The average entry price or open price as a number/string.
- "takeProfit": The take profit price if visible (can be empty string or null).
- "stopLoss": The stop loss price if visible (can be empty string or null).
- "margin": The margin or initial margin or cost (not position size, the actual margin posted) in USDT if visible.
- "leverage": The leverage multiplier (e.g., "10", "50") without the 'x'. If not found, return "10" as default.

If a value is not found, leave it as an empty string "".

Example Output:
{
  "symbol": "BTC/USDT",
  "direction": "buy",
  "entryPrice": "68500.50",
  "takeProfit": "70000",
  "stopLoss": "67000",
  "margin": "1000",
  "leverage": "50"
}
`;

        // Invoke Supabase Edge Function to bypass client-side geolocation locks
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                prompt: promptText,
                temperature: 0.1,
                responseMimeType: "application/json",
                image: {
                    mimeType: mimeType,
                    data: base64String
                }
            }
        });

        if (error) {
            throw new Error(`Edge Function Error: ${error.message || JSON.stringify(error)}`);
        }
        if (data?.error) {
            throw new Error(`AI Proxy Error: ${data.error} - ${JSON.stringify(data.details || '')}`);
        }

        const extractedText = data?.text || "{}";
        
        try {
            // Extra safety to strip potential markdown codeblocks if API ignores responseMimeType
            let cleanText = extractedText.replace(/```json/gi, '').replace(/```/gi, '').trim();
            const parsed = JSON.parse(cleanText);
            return { success: true, data: parsed };
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", extractedText);
            throw new Error("Invalid output format from AI.");
        }

    } catch (error) {
        console.error("OCR Error:", error);
        return { success: false, error: error.message };
    }
};
