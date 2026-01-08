
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// NOTE: For writing to DB, we really prefer the SERVICE_ROLE_KEY if RLS is strict.
// But for this demo with 'authenticated' policy, anon key + sign-in might work, 
// or simpler: we use anon key and rely on the policy we just created.

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Configuration ---
const CONFIG = {
    useMockData: true, // Set to FALSE when you have real API keys
    twitter_list: [
        'xinchennq', 'GokuCool', '0xVeryBigOrange', 'DrHashWesley', 'CryptoDevin', // Sample of the 50 KOLs
    ]
};

async function main() {
    console.log("📰 Starting Daily Alpha Factory...");
    const today = new Date().toISOString().split('T')[0];

    let reportData;

    try {
        if (CONFIG.useMockData) {
            console.log("⚠️ No API Keys found (or Mock Mode on). Generating Simulation Data...");
            reportData = generateMockData(today);
        } else {
            console.log("🔄 Connecting to Apify & OpenAI...");
            // Real logic would go here:
            // 1. Apify.run('actor-id', { handles: CONFIG.twitter_list })
            // 2. OpenAI.chat.completions.create({ prompt: "Summarize these tweets..." })
            // reportData = ...
        }

        console.log("💾 Saving report to Supabase...");

        // Upsert based on date (one report per day)
        const { data, error } = await supabase
            .from('daily_reports')
            .upsert(reportData, { onConflict: 'report_date' })
            .select();

        if (error) throw error;

        console.log(`✅ Success! Daily Report for ${today} is ready.`);
        console.log("Preview:", data[0].market_sentiment);

    } catch (err) {
        console.error("❌ Error in News Factory:", err);
    }
}

function generateMockData(date) {
    return {
        report_date: date,
        market_sentiment: {
            score: 72,
            status: "Greed",
            summary: "Market is heating up. BTC dominance dropping slightly as ETH/SOL ecosystem rotates. Sentiment indicates 'Altseason' anticipation."
        },
        airdrop_alpha: [
            { source: "@xinchennq", content: "Starknet final snapshot rumored for next week. Activity on mainnet > $100 volume recommended.", urgency: "High" },
            { source: "@AirdropAlchemist", content: "LayerZero verification phase starting. Check your wallet interaction count on their legit checker.", urgency: "Medium" }
        ],
        trading_signals: [
            { source: "@DrHashWesley", content: "Short term resistance for SOL at $115. Looking for a retest of $108 to long.", direction: "Long" },
            { source: "@0xWizard", content: "AI sector tokens ($RNDR, $FET) showing strong relative strength against BTC.", direction: "Neutral" }
        ],
        onchain_data: [
            { source: "@EmberCN", content: "Smart money address 0x3f... just moved 5M $USDT to Binance. Potential buy pressure incoming?", type: "Inflow" },
            { source: "@Glassnode", content: "Bitcoin exchange balance hits 3-year low. Supply shock scenario valid.", type: "Data" }
        ],
        kol_gems: [
            { source: "@GokuCool", content: "Found a low cap gem on Base chain: $CATGOLD. Risk high, but dev is doxxed.", tag: "Meme" }
        ]
    };
}

main();
