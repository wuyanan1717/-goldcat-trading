
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRpc() {
    console.log("Testing 'get_user_count' RPC...");
    const { data, error } = await supabase.rpc('get_user_count');

    if (error) {
        console.error("❌ RPC Failed:", error.message);
        console.error("Details:", error);
    } else {
        console.log("✅ RPC Success!");
        console.log(`Current User Count in DB: ${data}`);
    }
}

verifyRpc();
